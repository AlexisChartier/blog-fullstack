<?php

namespace App\Actions;

use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutUser
{
    public function execute(Request $request): void
    {
        UserSession::where('user_id', $request->user()->id)->delete();

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
