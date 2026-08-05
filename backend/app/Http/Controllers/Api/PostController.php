<?php

namespace App\Http\Controllers\Api;

use App\Actions\CreatePost;
use App\Actions\UpdatePost;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IndexPostRequest;
use App\Http\Requests\Api\StorePostRequest;
use App\Http\Requests\Api\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostController extends Controller
{
    public function index(IndexPostRequest $request): AnonymousResourceCollection
    {
        $posts = Post::published()
            ->with(['author:id,name,username,avatar_url', 'categories:id,name,slug', 'tags:id,name,slug'])
            ->search($request->input('search'))
            ->when($request->input('category'), function ($query, $slug) {
                $query->whereHas('categories', fn ($q) => $q->where('slug', $slug));
            })
            ->when($request->input('tag'), function ($query, $slug) {
                $query->whereHas('tags', fn ($q) => $q->where('slug', $slug));
            })
            ->latest('published_at')
            ->paginate(9);

        return PostResource::collection($posts);
    }

    public function show(string $slug): PostResource
    {
        $post = Post::where('slug', $slug)
            ->published()
            ->with([
                'author:id,name,username,avatar_url,bio',
                'categories:id,name,slug',
                'tags:id,name,slug',
                'comments' => fn ($q) => $q
                    ->approved()
                    ->whereNull('parent_id')
                    ->with([
                        'user:id,name,username,avatar_url',
                        'replies' => fn ($rq) => $rq
                            ->approved()
                            ->with('user:id,name,username,avatar_url')
                            ->orderBy('created_at'),
                    ])
                    ->orderByDesc('created_at'),
            ])
            ->firstOrFail();

        return new PostResource($post);
    }

    public function store(StorePostRequest $request, CreatePost $action): JsonResponse
    {
        $post = $action->execute($request);

        return response()->json([
            'message' => 'Post created',
            'post' => new PostResource($post),
        ], 201);
    }

    public function update(UpdatePostRequest $request, Post $post, UpdatePost $action): JsonResponse
    {
        $this->authorize('update', $post);

        $post = $action->execute($post, $request);

        return response()->json([
            'message' => 'Post updated',
            'post' => new PostResource($post),
        ]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json(['message' => 'Post deleted']);
    }
}
