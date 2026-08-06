<?php

namespace App\Actions;

use App\Http\Requests\Api\UpdatePostRequest;
use App\Models\Post;

class UpdatePost
{
    public function execute(Post $post, UpdatePostRequest $request): Post
    {
        $post->update($request->safe()->except(['categories', 'tags']));

        if ($request->has('categories')) {
            $post->categories()->sync($request->input('categories'));
        }
        if ($request->has('tags')) {
            $post->tags()->sync($request->input('tags'));
        }

        return $post->load(['author', 'categories', 'tags']);
    }
}
