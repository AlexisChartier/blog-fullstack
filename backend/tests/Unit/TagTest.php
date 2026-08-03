<?php

use App\Models\Post;
use App\Models\Tag;
use Illuminate\Support\Str;

describe('Tag Model', function () {
    it('generates slug on create', function () {
        $tag = Tag::factory()->create([
            'name' => 'Laravel',
            'slug' => null,
        ]);

        expect($tag->slug)->toBe(Str::slug('Laravel'));
    });

    it('uses provided slug if given', function () {
        $tag = Tag::factory()->create([
            'name' => 'Laravel',
            'slug' => 'lv',
        ]);

        expect($tag->slug)->toBe('lv');
    });

    it('belongs to many posts', function () {
        $tag = Tag::factory()->create();
        $posts = Post::factory(3)->create();
        $tag->posts()->attach($posts);

        expect($tag->posts)->toHaveCount(3);
    });
});
