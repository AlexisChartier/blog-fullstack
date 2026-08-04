<?php

namespace App\Actions;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginUser
{
    public function execute(array $credentials, Request $request): ?User
    {
        if (! Auth::attempt($credentials)) {
            return null;
        }

        $request->session()->regenerate();

        $user = $request->user();

        UserSession::where('user_id', $user->id)->delete();
        UserSession::create([
            'user_id' => $user->id,
            'session_id' => $request->session()->getId(),
        ]);

        return $user;
    }
}
