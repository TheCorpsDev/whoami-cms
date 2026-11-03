<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Big opening line of the About section. Text between *asterisks* is
 * highlighted in the accent colour on the site.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->json('about_headline')->nullable();
        });

        DB::table('profiles')->update(['about_headline' => json_encode([
            'it' => 'Scrivo backend di giorno e metto in produzione *i miei progetti* la sera.',
            'en' => 'I build backends by day and ship *my own projects* by night.',
        ])]);
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('about_headline');
        });
    }
};
