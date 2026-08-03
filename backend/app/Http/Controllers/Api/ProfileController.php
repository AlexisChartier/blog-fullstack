<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username,' . $request->user()->id],
            'bio' => ['nullable', 'string', 'max:500'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            if ($user->avatar_url) {
                Storage::disk('public')->delete($user->avatar_url);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar_url'] = $path;
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated',
            'user' => $user->load('roles'),
        ]);
    }
}
