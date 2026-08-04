<?php

namespace App\Actions;

use App\Models\Post;
use Illuminate\Http\Request;

class UpdatePost
{
    public function execute(Post $post, Request $request): Post
    {
        $post->update($request->except(['categories', 'tags']));

        if ($request->has('categories')) {
            $post->categories()->sync($request->input('categories'));
        }
        if ($request->has('tags')) {
            $post->tags()->sync($request->input('tags'));
        }

        return $post->load(['author', 'categories', 'tags']);
    }
}
