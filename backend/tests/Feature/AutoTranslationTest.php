<?php

namespace Tests\Feature;

use App\Models\Profile;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AutoTranslationTest extends TestCase
{
    use RefreshDatabase;

    private bool $deeplDown = false;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        config([
            'portfolio.admin_password_hash' => password_hash('secret-password', PASSWORD_BCRYPT, ['cost' => 4]),
            'services.deepl.key' => 'test-key:fx',
        ]);
        // Fake DeepL: "EN(<italian>)" for every text, in order.
        Http::fake([
            'api-free.deepl.com/*' => fn (Request $request) => $this->deeplDown
                ? Http::response(['message' => 'Quota exceeded'], 456)
                : Http::response([
                    'translations' => array_map(fn ($t) => ['detected_source_language' => 'IT', 'text' => "EN($t)"], $request['text']),
                ]),
        ]);
        $this->postJson('/api/admin/login', ['password' => 'secret-password'])->assertOk();
    }

    private function newProject(array $overrides = []): array
    {
        return [
            'slug' => 'nuovo', 'name' => 'Nuovo', 'category' => 'app',
            'label' => ['it' => 'Sito', 'en' => ''],
            'description' => ['it' => 'Un progetto nuovo.', 'en' => ''],
            'features' => ['it' => '', 'en' => ''],
            'tech' => [], 'visible' => true, 'featured' => false,
            ...$overrides,
        ];
    }

    public function test_empty_english_texts_are_translated_and_marked_for_review(): void
    {
        $response = $this->postJson('/api/admin/projects', $this->newProject())->assertCreated();

        $response->assertJsonPath('description.en', 'EN(Un progetto nuovo.)')
            ->assertJsonPath('label.en', 'EN(Sito)')
            ->assertJsonPath('features.en', '')
            ->assertJsonPath('translation_warning', null);
        $this->assertEqualsCanonicalizing(['label', 'description'], $response->json('auto_translated'));

        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'DeepL-Auth-Key test-key:fx') && $r['target_lang'] === 'EN-US');
    }

    public function test_changing_italian_retranslates_until_reviewed(): void
    {
        $project = $this->postJson('/api/admin/projects', $this->newProject())->json();

        $project['description']['it'] = 'Testo cambiato.';
        $updated = $this->putJson("/api/admin/projects/{$project['id']}", $project)->assertOk()->json();
        $this->assertSame('EN(Testo cambiato.)', $updated['description']['en']);
        $this->assertContains('description', $updated['auto_translated']);

        // Approving keeps the text and clears the "to review" mark.
        $approved = $this->putJson("/api/admin/projects/{$project['id']}", [...$updated, 'approved' => ['description']])->json();
        $this->assertNotContains('description', $approved['auto_translated']);

        // Once reviewed, a new Italian text no longer overwrites the English one.
        $approved['description']['it'] = 'Ancora diverso.';
        $again = $this->putJson("/api/admin/projects/{$project['id']}", $approved)->json();
        $this->assertSame('EN(Testo cambiato.)', $again['description']['en']);
    }

    public function test_editing_the_english_text_by_hand_counts_as_review(): void
    {
        $project = $this->postJson('/api/admin/projects', $this->newProject())->json();

        $project['description']['en'] = 'My own wording.';
        $updated = $this->putJson("/api/admin/projects/{$project['id']}", $project)->json();

        $this->assertSame('My own wording.', $updated['description']['en']);
        $this->assertNotContains('description', $updated['auto_translated']);
    }

    public function test_profile_lists_and_rotating_words_are_translated(): void
    {
        $profile = $this->getJson('/api/admin/profile')->json();
        $profile['rotating_words']['en'] = [];
        $profile['highlights'][0]['title']['en'] = '';

        $updated = $this->putJson('/api/admin/profile', $profile)->assertOk()->json();

        $this->assertSame(array_map(fn ($w) => "EN($w)", $profile['rotating_words']['it']), $updated['rotating_words']['en']);
        $this->assertSame('EN(Architetture pulite)', $updated['highlights'][0]['title']['en']);
        $this->assertEqualsCanonicalizing(['rotating_words', 'highlights.0.title'], Profile::current()->auto_translated);
        $this->assertArrayNotHasKey('auto_translated', $this->getJson('/api/portfolio')->json('profile'));
    }

    public function test_without_a_key_the_feature_is_off_and_silent(): void
    {
        config(['services.deepl.key' => null]);

        $this->getJson('/api/admin/me')->assertJson(['auto_translate' => false]);
        $response = $this->postJson('/api/admin/projects', $this->newProject())->assertCreated();

        $response->assertJsonPath('description.en', '')
            ->assertJsonPath('translation_warning', null)
            ->assertJsonPath('auto_translated', []);
        Http::assertNothingSent();
    }

    public function test_saving_still_works_when_deepl_fails(): void
    {
        $this->deeplDown = true;

        $response = $this->postJson('/api/admin/projects', $this->newProject())->assertCreated();

        $response->assertJsonPath('description.en', '');
        $this->assertStringContainsString('DeepL', $response->json('translation_warning'));
    }
}
