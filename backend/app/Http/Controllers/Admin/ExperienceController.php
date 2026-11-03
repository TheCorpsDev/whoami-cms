<?php

namespace App\Http\Controllers\Admin;

use App\Models\Experience;
use App\Support\Translations;
use Illuminate\Database\Eloquent\Model;

class ExperienceController extends ContentController
{
    protected function model(): string
    {
        return Experience::class;
    }

    protected function translatable(): array
    {
        return ['role', 'employment_type', 'description', 'highlights'];
    }

    protected function rules(?Model $item): array
    {
        return [
            ...Translations::rules('role'),
            'company' => ['required', 'string', 'max:255'],
            ...Translations::rules('employment_type', false),
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => self::month(true),
            'end_date' => self::month(),
            'hours' => ['nullable', 'integer', 'min:0', 'max:100000'],
            ...Translations::rules('description', false, 3000),
            ...Translations::rules('highlights', false, 3000),
            ...self::tags('tech'),
            'visible' => ['boolean'],
        ];
    }
}
