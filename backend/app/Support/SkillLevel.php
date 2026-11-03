<?php

namespace App\Support;

/**
 * How well a technology is known. The site shows it as 1 to 4 filled steps.
 */
final class SkillLevel
{
    public const CODES = ['basic', 'intermediate', 'advanced', 'expert'];

    public const DEFAULT = 'intermediate';
}
