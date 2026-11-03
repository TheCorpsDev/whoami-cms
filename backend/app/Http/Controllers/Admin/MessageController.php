<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\JsonResponse;

class MessageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Message::query()->latest()->limit(500)->get());
    }

    public function markRead(int $id): JsonResponse
    {
        $message = Message::query()->findOrFail($id);
        $message->update(['read_at' => $message->read_at ?? now()]);

        return response()->json($message);
    }

    public function destroy(int $id): JsonResponse
    {
        Message::query()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}
