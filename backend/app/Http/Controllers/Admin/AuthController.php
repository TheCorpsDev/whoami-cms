<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\CacheSweeper;
use App\Support\ClientKey;
use App\Support\DeepL;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'authenticated' => $request->session()->get('admin') === true,
            // Lets the admin explain whether English texts are translated on save.
            'auto_translate' => app(DeepL::class)->enabled(),
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate(['password' => ['required', 'string', 'max:200']]);

        CacheSweeper::maybeSweep();

        $key = 'admin-login|'.ClientKey::for($request->ip());
        $maxAttempts = config('portfolio.login_max_attempts');

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $minutes = (int) ceil(RateLimiter::availableIn($key) / 60);

            throw ValidationException::withMessages([
                'password' => "Troppi tentativi. Riprova tra $minutes minuti.",
            ])->status(429);
        }

        $hash = (string) config('portfolio.admin_password_hash');

        if ($hash === '') {
            Log::error('Admin login refused: ADMIN_PASSWORD_HASH is not configured.');
        }

        // password_verify never throws on a malformed hash, unlike Hash::check.
        if ($hash === '' || ! password_verify((string) $request->string('password'), $hash)) {
            RateLimiter::hit($key, config('portfolio.login_decay_minutes') * 60);
            Log::warning('Admin login failed.', ['ip' => $request->ip()]);

            throw ValidationException::withMessages(['password' => 'Password non valida.']);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->session()->put('admin', true);
        Log::info('Admin logged in.', ['ip' => $request->ip()]);

        return response()->json(['authenticated' => true]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['authenticated' => false]);
    }
}
