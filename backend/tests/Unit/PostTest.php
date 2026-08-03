<?php

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Str;

describe('Post Model', function () {
    it('generates slug on create', function () {
        $post = Post::factory()->create([
            'title' => 'My Awesome Post',
            'slug' => null,
        ]);

        expect($post->slug)->toBe(Str::slug('My Awesome Post'));
    });

    it('uses provided slug if given', function () {
        $post = Post::factory()->create([
            'title' => 'My Awesome Post',
            'slug' => 'custom-slug',
        ]);

        expect($post->slug)->toBe('custom-slug');
    });

    it('belongs to author', function () {
        $author = User::factory()->create();
        $post = Post::factory()->create(['author_id' => $author->id]);

        expect($post->author->id)->toBe($author->id);
    });

    it('has many categories (N:N)', function () {
        $post = Post::factory()->create();
        $cats = Category::factory(3)->create();
        $post->categories()->attach($cats);

        expect($post->categories)->toHaveCount(3);
    });

    it('has many tags (N:N)', function () {
        $post = Post::factory()->create();
        $tags = Tag::factory(2)->create();
        $post->tags()->attach($tags);

        expect($post->tags)->toHaveCount(2);
    });

    it('has comments relation', function () {
        $post = Post::factory()->create();
        $post->comments()->create([
            'user_id' => User::factory()->create()->id,
            'content' => 'Great post!',
            'is_approved' => true,
        ]);

        expect($post->comments)->toHaveCount(1);
    });

    it('scopePublished returns only published posts', function () {
        $published = Post::factory()->create([
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
        $draft = Post::factory()->create([
            'status' => 'draft',
            'published_at' => null,
        ]);

        $results = Post::published()->get();

        expect($results->contains($published->id))->toBeTrue();
        expect($results->contains($draft->id))->toBeFalse();
    });

    it('scopeSearch filters by title', function () {
        $post = Post::factory()->create(['title' => 'Laravel Best Practices']);
        $other = Post::factory()->create(['title' => 'Angular Tips']);

        $results = Post::search('Laravel')->get();

        expect($results->contains($post->id))->toBeTrue();
        expect($results->contains($other->id))->toBeFalse();
    });

    it('scopeSearch filters by excerpt', function () {
        $post = Post::factory()->create([
            'title' => 'Random Title',
            'excerpt' => 'Learn about Laravel ORM',
        ]);

        $results = Post::search('Laravel')->get();

        expect($results->contains($post->id))->toBeTrue();
    });

    it('scopeSearch returns all when no term', function () {
        Post::factory(3)->create();

        $results = Post::search(null)->get();

        expect($results)->toHaveCount(3);
    });

    it('scopeSearch returns all when empty string', function () {
        Post::factory(2)->create();

        $results = Post::search('')->get();

        expect($results)->toHaveCount(2);
    });
});
