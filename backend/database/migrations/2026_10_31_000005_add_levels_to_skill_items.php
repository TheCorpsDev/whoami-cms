<?php

use App\Support\SkillLevel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Stack items were plain strings; they become {"name": ..., "level": ...}.
 * Existing items start at the default level, to be adjusted from the admin.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (DB::table('skill_groups')->get(['id', 'items']) as $group) {
            $items = array_map(
                fn ($item) => is_array($item)
                    ? ['name' => (string) ($item['name'] ?? ''), 'level' => $item['level'] ?? SkillLevel::DEFAULT]
                    : ['name' => (string) $item, 'level' => SkillLevel::DEFAULT],
                json_decode($group->items, true) ?: [],
            );

            DB::table('skill_groups')->where('id', $group->id)->update(['items' => json_encode($items)]);
        }
    }

    public function down(): void
    {
        foreach (DB::table('skill_groups')->get(['id', 'items']) as $group) {
            $names = array_map(fn ($item) => is_array($item) ? $item['name'] : $item, json_decode($group->items, true) ?: []);
            DB::table('skill_groups')->where('id', $group->id)->update(['items' => json_encode($names)]);
        }
    }
};
