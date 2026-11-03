<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;

final class DeepL
{
    // Sent with every request: it steers vocabulary and tone, and is not billed.
    private const CONTEXT = 'Personal portfolio website of a full-stack software developer (Laravel, React, DevOps). Keep technology names unchanged.';

    public function enabled(): bool
    {
        return filled(config('services.deepl.key'));
    }

    /**
     * Translates Italian texts to English, keeping their order.
     *
     * @param  list<string>  $texts
     * @return list<string>
     */
    public function translate(array $texts): array
    {
        $key = (string) config('services.deepl.key');
        // Free keys end with ":fx" and use api-free; DEEPL_API_URL overrides the guess.
        $host = rtrim((string) (config('services.deepl.url') ?: (str_ends_with($key, ':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com')), '/');
        $translated = [];

        // DeepL accepts at most 50 texts per request.
        foreach (array_chunk($texts, 50) as $chunk) {
            $response = Http::withHeaders(['Authorization' => "DeepL-Auth-Key $key"])
                ->timeout(20)
                ->retry(2, 500, throw: false)
                ->post("$host/v2/translate", [
                    'text' => $chunk,
                    'source_lang' => 'IT',
                    'target_lang' => config('services.deepl.target_lang'),
                    'preserve_formatting' => true,
                    'context' => self::CONTEXT,
                ])
                ->throw();

            foreach ($response->json('translations', []) as $item) {
                $translated[] = (string) $item['text'];
            }
        }

        if (count($translated) !== count($texts)) {
            throw new \RuntimeException('DeepL returned '.count($translated).' translations for '.count($texts).' texts.');
        }

        return $translated;
    }
}
