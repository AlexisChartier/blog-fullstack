<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UpdateProfile
{
    public function execute(User $user, array $validated, Request $request): User
    {
        if ($request->hasFile('avatar')) {
            if ($user->avatar_url) {
                Storage::disk('public')->delete($user->avatar_url);
            }
            $validated['avatar_url'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($validated);

        return $user;
    }
}
