<?php

namespace App\Actions;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutUser
{
    public function execute(Request $request): void
    {
        $request->user()->forceFill(['session_id' => null])->save();
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
