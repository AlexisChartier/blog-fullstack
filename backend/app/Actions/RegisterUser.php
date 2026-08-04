<?php

namespace App\Actions;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RegisterUser
{
    public function execute(array $validated, Request $request): User
    {
        $user = User::create($validated);
        $user->assignRole('reader');

        Auth::login($user);
        $request->session()->regenerate();

        UserSession::where('user_id', $user->id)->delete();
        UserSession::create([
            'user_id' => $user->id,
            'session_id' => $request->session()->getId(),
        ]);

        return $user;
    }
}
