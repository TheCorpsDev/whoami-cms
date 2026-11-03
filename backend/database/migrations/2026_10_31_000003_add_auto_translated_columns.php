<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Paths of the English texts filled in by DeepL that the admin has not
 * reviewed yet, e.g. ["description", "highlights.0.title"].
 */
return new class extends Migration
{
    private const TABLES = ['profiles', 'experiences', 'projects', 'education', 'certifications', 'skill_groups'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->json('auto_translated')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('auto_translated');
            });
        }
    }
};
