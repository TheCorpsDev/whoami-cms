<?php

namespace App\Support;

/**
 * Helpers for fields stored as {"it": "...", "en": "..."}.
 */
final class Translations
{
    public const LOCALES = ['it', 'en'];

    /**
     * Validation rules for a translatable string: Italian is the source
     * language, English falls back to Italian on the site when empty.
     *
     * @return array<string, array<int, string>>
     */
    public static function rules(string $field, bool $required = true, int $max = 255): array
    {
        return [
            $field => [$required ? 'required' : 'nullable', 'array'],
            "$field.it" => [$required ? 'required' : 'nullable', 'string', "max:$max"],
            "$field.en" => ['nullable', 'string', "max:$max"],
        ];
    }

    /**
     * Keeps only the supported locales and turns missing values into "".
     *
     * @return array{it: string, en: string}
     */
    public static function clean(mixed $value): array
    {
        $value = is_array($value) ? $value : [];

        return [
            'it' => trim((string) ($value['it'] ?? '')),
            'en' => trim((string) ($value['en'] ?? '')),
        ];
    }
}
