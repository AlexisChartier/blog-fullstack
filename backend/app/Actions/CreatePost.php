<?php

namespace App\Actions;

use App\Models\Post;
use Illuminate\Http\Request;

class CreatePost
{
    public function execute(Request $request): Post
    {
        /** @var Post $post */
        $post = $request->user()->posts()->create($request->except(['categories', 'tags']));

        if ($categories = $request->input('categories')) {
            $post->categories()->sync($categories);
        }
        if ($tags = $request->input('tags')) {
            $post->tags()->sync($tags);
        }

        return $post->load(['author', 'categories', 'tags']);
    }
}
