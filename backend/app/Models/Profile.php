<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'auto_translated' => 'array',
        'role' => 'array',
        'rotating_words' => 'array',
        'hero_bio' => 'array',
        'about' => 'array',
        'about_headline' => 'array',
        'location' => 'array',
        'highlights' => 'array',
        'languages' => 'array',
        'available' => 'boolean',
    ];

    /**
     * The portfolio has exactly one profile row.
     */
    public static function current(): self
    {
        return static::query()->firstOrFail();
    }
}
