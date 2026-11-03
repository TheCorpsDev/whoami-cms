<?php

namespace App\Support;

/**
 * Language levels of the Common European Framework, plus mother tongue.
 * The site turns the code into a translated label and the bar width.
 */
final class LanguageLevel
{
    public const CODES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'];

    /**
     * Best guess from a free-text level such as "B1 · intermedio" or "madrelingua".
     */
    public static function fromText(string $text): string
    {
        if (preg_match('/\b([ABC][12])\b/i', $text, $match)) {
            return strtoupper($match[1]);
        }

        return preg_match('/madre|native|nativ/i', $text) ? 'native' : 'B1';
    }
}
