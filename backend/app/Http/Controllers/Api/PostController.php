<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StorePostRequest;
use App\Http\Requests\Api\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
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
                'comments' => fn ($q) => $q->approved()->with('user:id,name,username,avatar_url')->orderByDesc('created_at'),
            ])
            ->firstOrFail();

        return new PostResource($post);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        /** @var Post $post */
        $post = $request->user()->posts()->create($request->except(['categories', 'tags']));

        if ($categories = $request->input('categories')) {
            $post->categories()->sync($categories);
        }
        if ($tags = $request->input('tags')) {
            $post->tags()->sync($tags);
        }

        return response()->json([
            'message' => 'Post created',
            'post' => new PostResource($post->load(['author', 'categories', 'tags'])),
        ], 201);
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $this->authorize('update', $post);

        $post->update($request->except(['categories', 'tags']));

        if ($request->has('categories')) {
            $post->categories()->sync($request->input('categories'));
        }
        if ($request->has('tags')) {
            $post->tags()->sync($request->input('tags'));
        }

        return response()->json([
            'message' => 'Post updated',
            'post' => new PostResource($post->load(['author', 'categories', 'tags'])),
        ]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json(['message' => 'Post deleted']);
    }
}
