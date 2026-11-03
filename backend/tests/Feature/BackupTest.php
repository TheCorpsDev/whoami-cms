<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

/**
 * VACUUM INTO cannot run inside the transaction RefreshDatabase opens.
 */
class BackupTest extends TestCase
{
    use DatabaseMigrations;

    public function test_backup_download_is_a_sqlite_file(): void
    {
        $this->seed(DatabaseSeeder::class);
        config(['portfolio.admin_password_hash' => password_hash('secret-password', PASSWORD_BCRYPT, ['cost' => 4])]);
        $this->postJson('/api/admin/login', ['password' => 'secret-password'])->assertOk();

        $response = $this->get('/api/admin/backup/download')->assertOk();

        $this->assertStringStartsWith("SQLite format 3\0", file_get_contents($response->baseResponse->getFile()->getPathname()));
    }
}
