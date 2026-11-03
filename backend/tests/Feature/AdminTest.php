<?php

namespace Tests\Feature;

use App\Models\Project;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'correct horse battery staple';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        config(['portfolio.admin_password_hash' => password_hash(self::PASSWORD, PASSWORD_BCRYPT, ['cost' => 4])]);
    }

    private function login(): static
    {
        $this->postJson('/api/admin/login', ['password' => self::PASSWORD])->assertOk();

        return $this;
    }

    public function test_admin_routes_require_login(): void
    {
        $this->getJson('/api/admin/profile')->assertUnauthorized();
        $this->getJson('/api/admin/me')->assertJson(['authenticated' => false]);
    }

    public function test_wrong_password_is_rejected_and_then_locked(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/login', ['password' => 'nope'])->assertUnprocessable();
        }

        $this->postJson('/api/admin/login', ['password' => self::PASSWORD])->assertStatus(429);
    }

    public function test_login_lockout_follows_the_ipv6_prefix(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => "2001:db8:0:1::$i"])
                ->postJson('/api/admin/login', ['password' => 'nope'])->assertUnprocessable();
        }

        // A fresh address of the same /64 is already locked out, even with the right password.
        $this->withServerVariables(['REMOTE_ADDR' => '2001:db8:0:1::ff'])
            ->postJson('/api/admin/login', ['password' => self::PASSWORD])->assertStatus(429);
    }

    public function test_profile_location_has_an_english_version_and_can_be_cleared(): void
    {
        $this->login();
        $profile = $this->getJson('/api/admin/profile')->json();

        $profile['location'] = ['it' => 'Roma, Lazio', 'en' => 'Rome, Lazio'];
        $this->putJson('/api/admin/profile', $profile)->assertOk()->assertJsonPath('location.en', 'Rome, Lazio');
        $this->getJson('/api/portfolio')->assertJsonPath('profile.location.en', 'Rome, Lazio');

        $profile['location'] = ['it' => '', 'en' => ''];
        $this->putJson('/api/admin/profile', $profile)->assertOk()->assertJsonPath('location', null);
    }

    public function test_login_is_refused_when_no_hash_is_configured(): void
    {
        config(['portfolio.admin_password_hash' => null]);

        $this->postJson('/api/admin/login', ['password' => self::PASSWORD])->assertUnprocessable();
    }

    public function test_logout_ends_the_session(): void
    {
        $this->login();
        $this->getJson('/api/admin/me')->assertJson(['authenticated' => true]);

        $this->postJson('/api/admin/logout')->assertOk();
        $this->getJson('/api/admin/profile')->assertUnauthorized();
    }

    public function test_project_crud_and_reorder(): void
    {
        $this->login();

        $id = $this->postJson('/api/admin/projects', [
            'slug' => 'portfolio',
            'name' => 'Portfolio',
            'label' => ['it' => 'Sito', 'en' => 'Website', 'fr' => 'ignored'],
            'category' => 'app',
            'description' => ['it' => 'Questo sito.', 'en' => ''],
            'features' => ['it' => '', 'en' => ''],
            'tech' => ['Laravel', 'React'],
            'repo_url' => null,
            'demo_url' => null,
            'featured' => false,
            'visible' => true,
        ])->assertCreated()->json('id');

        $this->assertSame(['it' => 'Sito', 'en' => 'Website'], Project::query()->find($id)->label);

        $this->putJson("/api/admin/projects/$id", [
            ...Project::query()->find($id)->only(['slug', 'name', 'label', 'category', 'description', 'features', 'tech']),
            'visible' => false,
        ])->assertOk()->assertJson(['visible' => false]);

        $ids = Project::query()->ordered()->pluck('id')->reverse()->values()->all();
        $this->putJson('/api/admin/projects/reorder', ['ids' => $ids])->assertOk();
        $this->assertSame($id, Project::query()->ordered()->first()->id);

        $this->deleteJson("/api/admin/projects/$id")->assertNoContent();
        $this->assertNull(Project::query()->find($id));
    }

    public function test_duplicate_project_slug_is_rejected(): void
    {
        $this->login();

        $this->postJson('/api/admin/projects', [
            'slug' => 'northwind-tasks', 'name' => 'Copy', 'category' => 'app',
            'description' => ['it' => 'x'], 'tech' => [],
        ])->assertUnprocessable()->assertJsonValidationErrors('slug');
    }

    public function test_profile_update_and_photo_upload(): void
    {
        Storage::fake('public');
        $this->login();

        $profile = $this->getJson('/api/admin/profile')->assertOk()->json();
        $profile['available'] = false;
        $profile['rotating_words']['it'] = ['uno.', ' ', 'due.'];

        $this->putJson('/api/admin/profile', $profile)
            ->assertOk()
            ->assertJson(['available' => false, 'rotating_words' => ['it' => ['uno.', 'due.']]]);

        $photo = $this->post('/api/admin/profile/photo', ['photo' => UploadedFile::fake()->createWithContent('me.png', file_get_contents(base_path('tests/fixtures/photo.png')))], ['Accept' => 'application/json'])
            ->assertOk()->json('photo_url');

        Storage::disk('public')->assertExists(str_replace('/storage/', '', $photo));
    }

    public function test_language_level_must_be_a_cefr_code(): void
    {
        $this->login();

        $profile = $this->getJson('/api/admin/profile')->json();
        $this->assertSame('native', $profile['languages'][0]['level']);

        $profile['languages'][1]['level'] = 'C1';
        $this->putJson('/api/admin/profile', $profile)->assertOk()->assertJsonPath('languages.1.level', 'C1');

        $profile['languages'][1]['level'] = 'fluente';
        $this->putJson('/api/admin/profile', $profile)->assertUnprocessable()->assertJsonValidationErrors('languages.1.level');
    }

    public function test_stack_items_have_a_known_level(): void
    {
        $this->login();
        $group = $this->getJson('/api/admin/skill-groups')->json('0');
        $this->assertSame('advanced', $group['items'][0]['level']);

        $group['items'][0]['level'] = 'expert';
        $this->putJson("/api/admin/skill-groups/{$group['id']}", $group)->assertOk()->assertJsonPath('items.0.level', 'expert');

        $group['items'][0]['level'] = 'guru';
        $this->putJson("/api/admin/skill-groups/{$group['id']}", $group)->assertUnprocessable()->assertJsonValidationErrors('items.0.level');
    }

    public function test_restore_rejects_files_that_are_not_backups(): void
    {
        $this->login();

        $this->post('/api/admin/backup/restore', ['backup' => UploadedFile::fake()->createWithContent('x.sqlite', 'not a database')], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('backup');
    }
}
