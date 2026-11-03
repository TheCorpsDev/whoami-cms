<?php

use App\Support\LanguageLevel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Languages used to store a free-text level and a bar percentage; now they
 * store only the CEFR code (A1–C2 or "native") and the site derives the rest.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (DB::table('profiles')->get(['id', 'languages']) as $profile) {
            $languages = json_decode($profile->languages, true) ?: [];

            $converted = array_map(function (array $language) {
                $level = $language['level'] ?? '';

                if (is_array($level)) {
                    $level = LanguageLevel::fromText($level['it'] ?? $level['en'] ?? '');
                } elseif (! in_array($level, LanguageLevel::CODES, true)) {
                    $level = LanguageLevel::fromText((string) $level);
                }

                return ['name' => $language['name'] ?? ['it' => '', 'en' => ''], 'level' => $level];
            }, $languages);

            DB::table('profiles')->where('id', $profile->id)->update(['languages' => json_encode($converted)]);
        }
    }

    public function down(): void
    {
        // Irreversible on purpose: the old free-text levels cannot be rebuilt.
    }
};
