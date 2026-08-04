<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserPostController extends Controller
{
    public function index(string $username): AnonymousResourceCollection
    {
        $user = User::where('username', $username)->firstOrFail();

        return PostResource::collection(
            Post::where('author_id', $user->id)->published()->latest('published_at')->paginate(9)
        );
    }
}
