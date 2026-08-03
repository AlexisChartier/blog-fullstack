<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommentController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'min:2', 'max:1000'],
            'parent_id' => ['nullable', Rule::exists('comments', 'id')->where(fn ($q) => $q->where('post_id', $post->id))],
        ]);

        $comment = $post->comments()->create([
            ...$validated,
            'user_id' => $request->user()->id,
            'is_approved' => true,
        ]);

        $comment->load('user:id,name,username,avatar_url');

        return response()->json([
            'message' => 'Comment added',
            'comment' => new CommentResource($comment),
        ], 201);
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted']);
    }
}
