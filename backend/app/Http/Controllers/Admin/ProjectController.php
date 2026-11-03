<?php

namespace App\Http\Controllers\Admin;

use App\Models\Project;
use App\Support\Translations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class ProjectController extends ContentController
{
    protected function model(): string
    {
        return Project::class;
    }

    protected function translatable(): array
    {
        return ['label', 'description', 'features'];
    }

    protected function rules(?Model $item): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('projects')->ignore($item)],
            'name' => ['required', 'string', 'max:120'],
            ...Translations::rules('label', false, 80),
            'category' => ['required', Rule::in(['app', 'lib', 'infra'])],
            ...Translations::rules('description', true, 3000),
            ...Translations::rules('features', false, 3000),
            ...self::tags('tech'),
            'repo_url' => ['nullable', 'url:https,http', 'max:255'],
            'demo_url' => ['nullable', 'url:https,http', 'max:255'],
            'package_url' => ['nullable', 'url:https,http', 'max:255'],
            'featured' => ['boolean'],
            'visible' => ['boolean'],
        ];
    }
}
