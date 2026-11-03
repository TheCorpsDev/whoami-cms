<?php

namespace App\Models;

use App\Models\Concerns\Sortable;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use Sortable;

    protected $table = 'projects';

    protected $guarded = ['id'];

    protected $casts = [
        'auto_translated' => 'array',
        'label' => 'array',
        'description' => 'array',
        'features' => 'array',
        'tech' => 'array',
        'featured' => 'boolean',
        'visible' => 'boolean',
        'position' => 'integer',
    ];
}
