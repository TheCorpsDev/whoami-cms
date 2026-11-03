<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Translatable fields are JSON objects shaped as {"it": "...", "en": "..."}.
 * Dates are stored as "YYYY-MM" strings because the site only shows months.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('role');
            $table->json('rotating_words');
            $table->json('hero_bio');
            $table->json('about');
            $table->json('highlights');
            $table->json('languages');
            $table->boolean('available')->default(true);
            $table->string('location')->nullable();
            $table->string('email')->nullable();
            $table->string('github_url')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('cv_path')->nullable();
            $table->timestamps();
        });

        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->json('role');
            $table->string('company');
            $table->json('employment_type');
            $table->string('location')->nullable();
            $table->string('start_date', 7);
            $table->string('end_date', 7)->nullable();
            $table->unsignedInteger('hours')->nullable();
            $table->json('description');
            $table->json('highlights');
            $table->json('tech');
            $table->boolean('visible')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->json('label');
            $table->string('category', 20);
            $table->json('description');
            $table->json('features');
            $table->json('tech');
            $table->string('repo_url')->nullable();
            $table->string('demo_url')->nullable();
            $table->boolean('featured')->default(false);
            $table->boolean('visible')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('education', function (Blueprint $table) {
            $table->id();
            $table->json('title');
            $table->json('institution');
            $table->string('location')->nullable();
            $table->string('start_date', 7);
            $table->string('end_date', 7)->nullable();
            $table->string('url')->nullable();
            $table->string('grade')->nullable();
            $table->boolean('visible')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('certifications', function (Blueprint $table) {
            $table->id();
            $table->json('name');
            $table->string('issuer');
            $table->string('issued_at', 7)->nullable();
            $table->string('expires_at', 7)->nullable();
            $table->string('credential_id')->nullable();
            $table->string('url')->nullable();
            $table->json('description');
            $table->boolean('visible')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('skill_groups', function (Blueprint $table) {
            $table->id();
            $table->json('name');
            $table->json('items');
            $table->boolean('visible')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->text('body');
            $table->string('locale', 2)->default('it');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('skill_groups');
        Schema::dropIfExists('certifications');
        Schema::dropIfExists('education');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('experiences');
        Schema::dropIfExists('profiles');
    }
};
