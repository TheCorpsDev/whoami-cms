<?php

namespace Tests\Feature;

use App\Mail\ContactMessageReceived;
use App\Models\Message;
use App\Models\Project;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_portfolio_returns_only_visible_content_in_order(): void
    {
        Project::query()->where('slug', 'pocket-ledger')->update(['visible' => false]);

        $response = $this->getJson('/api/portfolio')->assertOk();

        $slugs = collect($response->json('projects'))->pluck('slug');
        $this->assertSame('northwind-tasks', $slugs->first());
        $this->assertNotContains('pocket-ledger', $slugs);
        $this->assertSame('Alex Rossi', $response->json('profile.name'));
        $this->assertArrayNotHasKey('position', $response->json('projects.0'));
    }

    public function test_hidden_education_is_not_published(): void
    {
        $titles = collect($this->getJson('/api/portfolio')->assertOk()->json('education'))->pluck('title.en');

        $this->assertContains('Bachelor\'s degree in Computer Science', $titles);
        $this->assertNotContains('Master\'s degree in Software Engineering', $titles);
    }

    public function test_contact_message_is_stored_and_forwarded(): void
    {
        Mail::fake();
        config(['portfolio.contact_notify_email' => 'me@example.com']);

        $this->postJson('/api/contact', [
            'name' => 'Mario Rossi',
            'email' => 'mario@example.com',
            'body' => 'Ciao, ho un progetto da proporti.',
            'locale' => 'it',
        ])->assertCreated();

        $this->assertDatabaseHas('messages', ['email' => 'mario@example.com']);
        Mail::assertSent(ContactMessageReceived::class, fn ($mail) => $mail->hasTo('me@example.com') && $mail->hasReplyTo('mario@example.com'));
    }

    public function test_honeypot_submissions_are_dropped_silently(): void
    {
        $this->postJson('/api/contact', [
            'name' => 'Bot',
            'email' => 'bot@example.com',
            'body' => 'Buy cheap things now!!!',
            'website' => 'https://spam.example',
        ])->assertAccepted();

        $this->assertSame(0, Message::query()->count());
    }

    public function test_notification_mail_keeps_apostrophes_and_quotes(): void
    {
        $message = Message::query()->create([
            'name' => "Dell'Orto",
            'email' => 'mario@example.com',
            'body' => "Test sull'invio della \"mail\"",
            'locale' => 'it',
        ]);

        $text = (new ContactMessageReceived($message))->render();

        $this->assertStringContainsString("Dell'Orto", $text);
        $this->assertStringContainsString("sull'invio della \"mail\"", $text);
        $this->assertStringNotContainsString('&#039;', $text);
    }

    public function test_contact_limit_follows_the_ipv6_prefix_and_a_global_cap(): void
    {
        Mail::fake();
        config(['portfolio.contact_max_per_hour' => 2, 'portfolio.contact_max_global_per_hour' => 4]);
        $payload = ['name' => 'Mario', 'email' => 'mario@example.com', 'body' => 'Un messaggio abbastanza lungo.'];
        $from = fn (string $ip) => $this->withServerVariables(['REMOTE_ADDR' => $ip])->postJson('/api/contact', $payload);

        // Three addresses of the same /64 share one quota of two.
        $from('2001:db8:0:1::1')->assertCreated();
        $from('2001:db8:0:1::2')->assertCreated();
        $from('2001:db8:0:1::3')->assertStatus(429);

        // Another prefix has its own quota, but the whole form is capped at four per hour.
        $from('2001:db8:0:2::1')->assertCreated();
        $from('2001:db8:0:2::2')->assertCreated();
        $from('2001:db8:0:3::1')->assertStatus(429);
    }

    public function test_contact_form_is_rate_limited(): void
    {
        config(['portfolio.contact_max_per_hour' => 2]);
        $payload = ['name' => 'Mario', 'email' => 'mario@example.com', 'body' => 'Un messaggio abbastanza lungo.'];

        $this->postJson('/api/contact', $payload)->assertCreated();
        $this->postJson('/api/contact', $payload)->assertCreated();
        $this->postJson('/api/contact', $payload)->assertTooManyRequests();
    }
}
