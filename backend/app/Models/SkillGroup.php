<?php

namespace App\Models;

use App\Models\Concerns\Sortable;
use Illuminate\Database\Eloquent\Model;

class SkillGroup extends Model
{
    use Sortable;

    protected $table = 'skill_groups';

    protected $guarded = ['id'];

    protected $casts = [
        'auto_translated' => 'array',
        'name' => 'array',
        'items' => 'array',
        'visible' => 'boolean',
        'position' => 'integer',
    ];
}
