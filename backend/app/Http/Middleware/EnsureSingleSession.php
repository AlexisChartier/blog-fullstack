<?php

namespace App\Http\Middleware;

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
            $user = Auth::user();
            $currentSessionId = $request->session()->getId();

            if ($user->session_id !== null && $user->session_id !== $currentSessionId) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return response()->json([
                    'message' => 'Your session has been terminated because you logged in from another device.',
                ], 401);
            }

            if ($user->session_id !== $currentSessionId) {
                $user->forceFill(['session_id' => $currentSessionId])->save();
            }
        }

        return $response;
    }
}
