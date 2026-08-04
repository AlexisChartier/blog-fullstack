<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\UserSession;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSingleSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (Auth::check() && $request->hasSession()) {
            /** @var User $user */
            $user = Auth::user();
            $currentSessionId = $request->session()->getId();

            /** @var UserSession|null $activeSession */
            $activeSession = $user->activeSession()->first();

            if ($activeSession !== null && $activeSession->session_id !== $currentSessionId) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return response()->json([
                    'message' => 'Your session has been terminated because you logged in from another device.',
                ], 401);
            }

            if ($activeSession === null || $activeSession->session_id !== $currentSessionId) {
                UserSession::where('user_id', $user->id)->delete();
                UserSession::create([
                    'user_id' => $user->id,
                    'session_id' => $currentSessionId,
                ]);
            }
        }

        return $response;
    }
}
