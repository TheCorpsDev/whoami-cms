<?php

namespace App\Http\Controllers\Admin;

use App\Models\Certification;
use App\Support\Translations;
use Illuminate\Database\Eloquent\Model;

class CertificationController extends ContentController
{
    protected function model(): string
    {
        return Certification::class;
    }

    protected function translatable(): array
    {
        return ['name', 'description'];
    }

    protected function rules(?Model $item): array
    {
        return [
            ...Translations::rules('name'),
            'issuer' => ['required', 'string', 'max:255'],
            'issued_at' => self::month(),
            'expires_at' => self::month(),
            'credential_id' => ['nullable', 'string', 'max:255'],
            'url' => ['nullable', 'url:https,http', 'max:255'],
            ...Translations::rules('description', false, 1000),
            'visible' => ['boolean'],
        ];
    }
}
