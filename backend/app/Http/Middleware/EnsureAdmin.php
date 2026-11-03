<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->session()->get('admin') !== true) {
            return response()->json(['message' => 'Non autenticato.'], 401);
        }

        return $next($request);
    }
}
