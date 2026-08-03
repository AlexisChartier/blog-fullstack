<?php

use App\Models\Category;
use App\Models\Post;
use Illuminate\Support\Str;

describe('Category Model', function () {
    it('generates slug on create', function () {
        $cat = Category::factory()->create([
            'name' => 'Web Development',
            'slug' => null,
        ]);

        expect($cat->slug)->toBe(Str::slug('Web Development'));
    });

    it('uses provided slug if given', function () {
        $cat = Category::factory()->create([
            'name' => 'Web Development',
            'slug' => 'web-dev',
        ]);

        expect($cat->slug)->toBe('web-dev');
    });

    it('belongs to many posts', function () {
        $cat = Category::factory()->create();
        $posts = Post::factory(2)->create();
        $cat->posts()->attach($posts);

        expect($cat->posts)->toHaveCount(2);
    });
});
