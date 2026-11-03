<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Admin-sortable content that can be hidden from the public site.
 */
trait Sortable
{
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('position')->orderBy('id');
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('visible', true);
    }

    protected static function bootSortable(): void
    {
        static::creating(function ($model) {
            if (! $model->position) {
                $model->position = (int) static::query()->max('position') + 1;
            }
        });
    }
}
