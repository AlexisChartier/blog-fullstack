<?php

namespace App\Actions;

use App\Models\User;
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
        $request->user()->forceFill(['session_id' => $request->session()->getId()])->save();

        return $request->user();
    }
}
