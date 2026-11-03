<?php

namespace App\Models;

use App\Models\Concerns\Sortable;
use Illuminate\Database\Eloquent\Model;

class Education extends Model
{
    use Sortable;

    protected $table = 'education';

    protected $guarded = ['id'];

    protected $casts = [
        'auto_translated' => 'array',
        'title' => 'array',
        'institution' => 'array',
        'visible' => 'boolean',
        'position' => 'integer',
    ];
}
