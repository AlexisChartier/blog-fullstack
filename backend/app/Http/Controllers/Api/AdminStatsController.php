<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminStatsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        return response()->json([
            'data' => [
                'users' => User::count(),
                'posts' => Post::count(),
                'published_posts' => Post::published()->count(),
                'draft_posts' => Post::where('status', 'draft')->count(),
                'comments' => Comment::count(),
                'approved_comments' => Comment::where('is_approved', true)->count(),
                'pending_comments' => Comment::where('is_approved', false)->count(),
                'categories' => Category::count(),
                'tags' => Tag::count(),
            ],
        ]);
    }
}
