<?php

namespace App\Support;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Fills the English side of translatable fields when the admin saves, and
 * remembers which English texts came from DeepL and still need a review.
 *
 * A field is (re)translated when its Italian text is set and either the
 * English text is empty, or the English text is an unreviewed machine
 * translation that the admin left untouched while changing the Italian.
 * Editing the English text by hand, or approving it, marks it as reviewed.
 */
final class AutoTranslator
{
    public function __construct(private DeepL $deepl) {}

    /**
     * @param  array<string, mixed>  $data  validated and cleaned payload
     * @param  array<string, mixed>  $previous  stored attributes, [] when creating
     * @param  list<string>  $previousAuto  paths still to review before this save
     * @param  list<string>  $patterns  translatable paths, "*" matches list indexes
     * @param  list<string>  $approved  paths the admin approved in this save
     * @return array{0: array<string, mixed>, 1: list<string>, 2: string|null}
     */
    public function apply(array $data, array $previous, array $previousAuto, array $patterns, array $approved): array
    {
        $auto = [];
        $queue = [];

        foreach ($this->expand($patterns, $data) as $path) {
            $value = Arr::get($data, $path);
            if (! is_array($value) || self::isEmpty($value['it'] ?? null)) {
                continue;
            }

            $old = Arr::get($previous, $path);
            $wasAuto = in_array($path, $previousAuto, true) && ! in_array($path, $approved, true);
            $untouched = is_array($old) && ($value['en'] ?? null) == ($old['en'] ?? null);

            if (self::isEmpty($value['en'] ?? null)) {
                $queue[$path] = $value['it'];
            } elseif ($wasAuto && $untouched) {
                if ($value['it'] != ($old['it'] ?? null)) {
                    $queue[$path] = $value['it'];
                } else {
                    $auto[] = $path;
                }
            }
        }

        if ($queue === []) {
            return [$data, $auto, null];
        }

        // Without DEEPL_API_KEY the feature is simply off: English texts stay
        // as written and empty ones fall back to Italian on the site.
        if (! $this->deepl->enabled()) {
            return [$data, [...$auto, ...$this->stillAuto($queue, $previousAuto, $approved)], null];
        }

        // One request for every text, flattening lists such as the rotating words.
        $texts = [];
        foreach ($queue as $source) {
            foreach ((array) $source as $text) {
                $texts[] = (string) $text;
            }
        }

        try {
            $translated = $this->deepl->translate($texts);
        } catch (Throwable $e) {
            Log::warning('Automatic translation failed.', ['error' => $e->getMessage()]);

            return [$data, [...$auto, ...$this->stillAuto($queue, $previousAuto, $approved)], 'DeepL non ha risposto: le traduzioni non sono state aggiornate. Riprova a salvare più tardi.'];
        }

        $offset = 0;
        foreach ($queue as $path => $source) {
            $count = count((array) $source);
            $result = array_slice($translated, $offset, $count);
            $offset += $count;

            Arr::set($data, "$path.en", is_array($source) ? $result : $result[0]);
            $auto[] = $path;
        }

        return [$data, $auto, null];
    }

    /**
     * Fields that could not be translated keep their "to review" state.
     *
     * @param  array<string, mixed>  $queue
     * @return list<string>
     */
    private function stillAuto(array $queue, array $previousAuto, array $approved): array
    {
        return array_values(array_filter(
            array_keys($queue),
            fn (string $path) => in_array($path, $previousAuto, true) && ! in_array($path, $approved, true),
        ));
    }

    /**
     * @return list<string>
     */
    private function expand(array $patterns, array $data): array
    {
        $paths = [];

        foreach ($patterns as $pattern) {
            if (! str_contains($pattern, '*')) {
                $paths[] = $pattern;

                continue;
            }

            [$list, $rest] = explode('.*.', $pattern, 2);
            foreach (array_keys((array) Arr::get($data, $list, [])) as $index) {
                $paths[] = "$list.$index.$rest";
            }
        }

        return $paths;
    }

    private static function isEmpty(mixed $value): bool
    {
        return $value === null || $value === '' || $value === [];
    }
}
