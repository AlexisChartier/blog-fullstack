<?php

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;

describe('Posts - Public endpoints', function () {
    it('lists published posts', function () {
        $published = Post::factory()->create([
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);

        $this->getJson('/api/posts')
            ->assertOk()
            ->assertJsonPath('data.0.id', $published->id);
    });

    it('does not list draft posts', function () {
        Post::factory()->create([
            'status' => 'draft',
            'published_at' => null,
        ]);

        $response = $this->getJson('/api/posts')->assertOk();

        expect($response->json('meta.total'))->toBe(0);
    });

    it('paginates posts', function () {
        Post::factory(15)->create([
            'status' => 'published',
            'published_at' => now()->subDays(rand(1, 30)),
        ]);

        $response = $this->getJson('/api/posts')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        expect($response->json('data'))->toHaveCount(9);
        expect($response->json('meta.total'))->toBe(15);
    });

    it('filters by category', function () {
        $cat = Category::factory()->create(['slug' => 'tech']);
        $postInCat = Post::factory()->create(['status' => 'published', 'published_at' => now()->subDay()]);
        Post::factory()->create(['status' => 'published', 'published_at' => now()->subDay()]);
        $postInCat->categories()->attach($cat);

        $response = $this->getJson('/api/posts?category=tech')
            ->assertOk();

        expect($response->json('meta.total'))->toBe(1);
        expect($response->json('data.0.id'))->toBe($postInCat->id);
    });

    it('filters by tag', function () {
        $tag = Tag::factory()->create(['slug' => 'laravel']);
        $postWithTag = Post::factory()->create(['status' => 'published', 'published_at' => now()->subDay()]);
        Post::factory()->create(['status' => 'published', 'published_at' => now()->subDay()]);
        $postWithTag->tags()->attach($tag);

        $response = $this->getJson('/api/posts?tag=laravel')
            ->assertOk();

        expect($response->json('meta.total'))->toBe(1);
        expect($response->json('data.0.id'))->toBe($postWithTag->id);
    });

    it('searches posts by title', function () {
        Post::factory()->create([
            'title' => 'Laravel Tips',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
        Post::factory()->create([
            'title' => 'Angular News',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/posts?search=Laravel')
            ->assertOk();

        expect($response->json('meta.total'))->toBe(1);
        expect($response->json('data.0.title'))->toBe('Laravel Tips');
    });

    it('shows a single post by slug', function () {
        $post = Post::factory()->create([
            'slug' => 'my-post',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);

        $this->getJson('/api/posts/my-post')
            ->assertOk()
            ->assertJsonPath('data.id', $post->id)
            ->assertJsonPath('data.slug', 'my-post');
    });

    it('returns 404 for draft post', function () {
        Post::factory()->create([
            'slug' => 'draft-post',
            'status' => 'draft',
            'published_at' => null,
        ]);

        $this->withExceptionHandling()->getJson('/api/posts/draft-post')
            ->assertNotFound();
    });

    it('returns 404 for non-existent post', function () {
        $this->withExceptionHandling()->getJson('/api/posts/non-existent')
            ->assertNotFound();
    });

    it('includes author categories and tags in response', function () {
        $author = User::factory()->create();
        $cat = Category::factory()->create();
        $tag = Tag::factory()->create();
        $post = Post::factory()->create([
            'author_id' => $author->id,
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
        $post->categories()->attach($cat);
        $post->tags()->attach($tag);

        $this->getJson("/api/posts/{$post->slug}")
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'author' => ['id', 'name', 'username'],
                    'categories' => [['id', 'name', 'slug']],
                    'tags' => [['id', 'name', 'slug']],
                ],
            ]);
    });
});
