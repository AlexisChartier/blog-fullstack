<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function show(string $username): UserResource
    {
        $user = User::where('username', $username)
            ->with(['posts' => fn ($q) => $q->published()->latest('published_at')->limit(10)])
            ->firstOrFail();

        return new UserResource($user);
    }

    public function posts(string $username): AnonymousResourceCollection
    {
        $user = User::where('username', $username)->firstOrFail();

        return \App\Http\Resources\PostResource::collection(
            $user->posts()->published()->latest('published_at')->paginate(9)
        );
    }
}
