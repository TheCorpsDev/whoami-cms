<?php

namespace App\Models;

use App\Models\Concerns\Sortable;
use Illuminate\Database\Eloquent\Model;

class Experience extends Model
{
    use Sortable;

    protected $table = 'experiences';

    protected $guarded = ['id'];

    protected $casts = [
        'auto_translated' => 'array',
        'role' => 'array',
        'employment_type' => 'array',
        'description' => 'array',
        'highlights' => 'array',
        'tech' => 'array',
        'visible' => 'boolean',
        'position' => 'integer',
    ];
}
