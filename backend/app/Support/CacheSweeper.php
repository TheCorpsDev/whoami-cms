<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Lottery;

/**
 * The database cache store deletes an expired row only when the same key is read
 * again, so one-off rate-limiter keys would pile up forever. Every so often a
 * request removes the expired rows.
 */
final class CacheSweeper
{
    public static function maybeSweep(): void
    {
        if (config('cache.default') !== 'database') {
            return;
        }

        Lottery::odds(1, 50)->winner(function () {
            DB::table(config('cache.stores.database.table', 'cache'))
                ->where('expiration', '<', now()->getTimestamp())
                ->delete();
        })->choose();
    }
}
