<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminPostController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $posts = Post::with(['author:id,name,username,avatar_url', 'categories:id,name,slug', 'tags:id,name,slug'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return PostResource::collection($posts);
    }
}
