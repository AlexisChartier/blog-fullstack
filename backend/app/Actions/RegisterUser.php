<?php

namespace App\Actions;

use App\Models\User;
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
        $user->forceFill(['session_id' => $request->session()->getId()])->save();

        return $user;
    }
}
