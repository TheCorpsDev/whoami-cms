<?php

namespace App\Http\Controllers\Admin;

use App\Models\SkillGroup;
use App\Support\SkillLevel;
use App\Support\Translations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class SkillGroupController extends ContentController
{
    protected function model(): string
    {
        return SkillGroup::class;
    }

    protected function translatable(): array
    {
        return ['name'];
    }

    protected function rules(?Model $item): array
    {
        return [
            ...Translations::rules('name', true, 60),
            'items' => ['present', 'array', 'max:40'],
            'items.*.name' => ['required', 'string', 'max:60'],
            'items.*.level' => ['required', Rule::in(SkillLevel::CODES)],
            'visible' => ['boolean'],
        ];
    }
}
