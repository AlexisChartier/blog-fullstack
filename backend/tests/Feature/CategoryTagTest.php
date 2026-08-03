<?php

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;

describe('Categories API', function () {
    it('lists all categories', function () {
        Category::factory(3)->create();

        $response = $this->getJson('/api/categories')
            ->assertOk();

        expect($response->json('data'))->toHaveCount(3);
    });

    it('includes posts_count', function () {
        $cat = Category::factory()->create();
        $cat->posts()->attach(
            Post::factory(2)->create([
                'status' => 'published',
                'published_at' => now()->subDay(),
            ])
        );

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.posts_count', 2);
    });
});

describe('Tags API', function () {
    it('lists all tags', function () {
        Tag::factory(3)->create();

        $response = $this->getJson('/api/tags')
            ->assertOk();

        expect($response->json('data'))->toHaveCount(3);
    });

    it('includes posts_count', function () {
        $tag = Tag::factory()->create();
        $tag->posts()->attach(
            Post::factory(3)->create([
                'status' => 'published',
                'published_at' => now()->subDay(),
            ])
        );

        $this->getJson('/api/tags')
            ->assertOk()
            ->assertJsonPath('data.0.posts_count', 3);
    });
});
