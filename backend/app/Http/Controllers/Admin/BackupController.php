<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use PDO;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

/**
 * Download and restore the whole SQLite database. Uploaded files (photo, CV)
 * live in the storage volume and are not part of the backup.
 */
class BackupController extends Controller
{
    private const REQUIRED_TABLES = ['profiles', 'experiences', 'projects', 'education', 'certifications', 'skill_groups', 'messages'];

    public function info(): JsonResponse
    {
        $path = $this->databasePath();

        return response()->json([
            'size' => is_file($path) ? filesize($path) : 0,
            'modified_at' => is_file($path) ? date(DATE_ATOM, filemtime($path)) : null,
        ]);
    }

    public function download(): BinaryFileResponse
    {
        $target = tempnam(sys_get_temp_dir(), 'portfolio-backup-');
        @unlink($target);

        // VACUUM INTO writes a consistent copy even while the app is serving requests.
        DB::statement('VACUUM INTO ?', [$target]);
        chmod($target, 0600);

        return response()
            ->download($target, 'portfolio-'.now()->format('Y-m-d-His').'.sqlite', ['Content-Type' => 'application/vnd.sqlite3'])
            ->deleteFileAfterSend();
    }

    public function restore(Request $request): JsonResponse
    {
        $request->validate(['backup' => ['required', 'file', 'max:51200']]);

        $upload = $request->file('backup')->getRealPath();
        $this->assertValidBackup($upload);

        $path = $this->databasePath();
        $previous = $path.'.before-restore';

        DB::disconnect();
        copy($path, $previous);

        try {
            copy($upload, $path);
            DB::reconnect();
            // Older backups may miss newer tables or columns.
            Artisan::call('migrate', ['--force' => true]);
            // A snapshot must not bring back sessions or rate-limit state that has since expired.
            DB::table('sessions')->delete();
            DB::table(config('cache.stores.database.table', 'cache'))->delete();
        } catch (Throwable $e) {
            DB::disconnect();
            copy($previous, $path);
            DB::reconnect();
            Log::error('Database restore failed, previous database kept.', ['error' => $e->getMessage()]);

            throw ValidationException::withMessages(['backup' => 'Ripristino non riuscito: il database precedente è stato mantenuto.']);
        }

        Log::warning('Database restored from an uploaded backup.');

        return response()->json(['restored' => true]);
    }

    private function assertValidBackup(string $file): void
    {
        $header = (string) file_get_contents($file, false, null, 0, 16);

        if ($header !== "SQLite format 3\0") {
            throw ValidationException::withMessages(['backup' => 'Il file non è un database SQLite.']);
        }

        try {
            $pdo = new PDO('sqlite:'.$file, options: [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type = 'table'")->fetchAll(PDO::FETCH_COLUMN);
            $integrity = $pdo->query('PRAGMA integrity_check')->fetchColumn();
            $pdo = null;
        } catch (Throwable) {
            throw ValidationException::withMessages(['backup' => 'Il database caricato non è leggibile.']);
        }

        if ($integrity !== 'ok' || array_diff(self::REQUIRED_TABLES, $tables) !== []) {
            throw ValidationException::withMessages(['backup' => 'Il file non è un backup di questo portfolio.']);
        }
    }

    private function databasePath(): string
    {
        return (string) config('database.connections.sqlite.database');
    }
}
