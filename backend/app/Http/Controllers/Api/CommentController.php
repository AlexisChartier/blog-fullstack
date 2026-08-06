<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCommentRequest;
use App\Http\Requests\Api\UpdateCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CommentController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Comment::class);

        return CommentResource::collection(
            Comment::with(['user:id,name,username,avatar_url', 'post:id,title,slug'])
                ->orderByDesc('created_at')
                ->paginate(20)
        );
    }

    public function store(StoreCommentRequest $request, Post $post): JsonResponse
    {
        abort_unless($post->status === 'published' && $post->published_at?->isPast(), 404);

        $comment = $post->comments()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'is_approved' => true,
        ]);

        $comment->load('user:id,name,username,avatar_url');

        return response()->json([
            'message' => 'Comment added',
            'comment' => new CommentResource($comment),
        ], 201);
    }

    public function update(UpdateCommentRequest $request, Comment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $comment->update($request->validated());

        return response()->json([
            'message' => 'Comment updated',
            'comment' => new CommentResource($comment->fresh('user:id,name,username,avatar_url')),
        ]);
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted']);
    }
}
