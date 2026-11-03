<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The city line of the profile becomes an Italian/English pair like every other
 * text. Existing values are copied to both languages; the only Italian word of the
 * data in use, "Sicilia", gets its English name. Edit the rest from /admin.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (DB::table('profiles')->get(['id', 'location']) as $row) {
            $value = trim((string) $row->location);

            if ($value === '' || str_starts_with($value, '{')) {
                continue;
            }

            DB::table('profiles')->where('id', $row->id)->update([
                'location' => json_encode(['it' => $value, 'en' => str_replace('Sicilia', 'Sicily', $value)], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    public function down(): void
    {
        foreach (DB::table('profiles')->get(['id', 'location']) as $row) {
            $decoded = json_decode((string) $row->location, true);

            if (is_array($decoded)) {
                DB::table('profiles')->where('id', $row->id)->update(['location' => $decoded['it'] ?? null]);
            }
        }
    }
};
