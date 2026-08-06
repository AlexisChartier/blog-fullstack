<?php

namespace App\Actions;

use App\Http\Requests\Api\StorePostRequest;
use App\Models\Post;

class CreatePost
{
    public function execute(StorePostRequest $request): Post
    {
        /** @var Post $post */
        $post = $request->user()->posts()->create($request->safe()->except(['categories', 'tags']));

        if ($categories = $request->input('categories')) {
            $post->categories()->sync($categories);
        }
        if ($tags = $request->input('tags')) {
            $post->tags()->sync($tags);
        }

        return $post->load(['author', 'categories', 'tags']);
    }
}
