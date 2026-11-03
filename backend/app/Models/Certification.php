<?php

namespace App\Models;

use App\Models\Concerns\Sortable;
use Illuminate\Database\Eloquent\Model;

class Certification extends Model
{
    use Sortable;

    protected $table = 'certifications';

    protected $guarded = ['id'];

    protected $casts = [
        'auto_translated' => 'array',
        'name' => 'array',
        'description' => 'array',
        'visible' => 'boolean',
        'position' => 'integer',
    ];
}
