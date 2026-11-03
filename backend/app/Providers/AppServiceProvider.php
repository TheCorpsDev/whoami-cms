<?php

namespace App\Providers;

use App\Support\CacheSweeper;
use App\Support\ClientKey;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Defined here and not in the routing callback of bootstrap/app.php:
        // that callback is skipped when routes are cached (production).
        RateLimiter::for('contact', function (Request $request) {
            CacheSweeper::maybeSweep();

            return [
                Limit::perHour(config('portfolio.contact_max_per_hour'))->by('contact|'.ClientKey::for($request->ip())),
                // Caps the whole form too, so rotating addresses cannot flood the inbox.
                Limit::perHour(config('portfolio.contact_max_global_per_hour'))->by('contact|all'),
            ];
        });
    }
}
