<?php

namespace App\Http\Controllers\Admin;

use App\Models\Education;
use App\Support\Translations;
use Illuminate\Database\Eloquent\Model;

class EducationController extends ContentController
{
    protected function model(): string
    {
        return Education::class;
    }

    protected function translatable(): array
    {
        return ['title', 'institution'];
    }

    protected function rules(?Model $item): array
    {
        return [
            ...Translations::rules('title'),
            ...Translations::rules('institution'),
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => self::month(true),
            'end_date' => self::month(),
            'url' => ['nullable', 'url:https,http', 'max:255'],
            'grade' => ['nullable', 'string', 'max:40'],
            'visible' => ['boolean'],
        ];
    }
}
