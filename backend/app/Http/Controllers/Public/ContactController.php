<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Mail\ContactMessageReceived;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Throwable;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'body' => ['required', 'string', 'min:10', 'max:5000'],
            'locale' => ['nullable', Rule::in(['it', 'en'])],
            // Honeypot: hidden from people, filled in by most spam bots.
            'website' => ['nullable', 'string', 'max:255'],
        ]);

        if (filled($data['website'] ?? null)) {
            return response()->json(['sent' => true], 202);
        }

        $message = Message::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'body' => $data['body'],
            'locale' => $data['locale'] ?? 'it',
        ]);

        $to = config('portfolio.contact_notify_email');

        if ($to) {
            try {
                Mail::to($to)->send(new ContactMessageReceived($message));
            } catch (Throwable $e) {
                // The message is already saved in the admin: a mail outage must not lose it.
                Log::error('Contact notification e-mail failed.', ['message_id' => $message->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json(['sent' => true], 201);
    }
}
