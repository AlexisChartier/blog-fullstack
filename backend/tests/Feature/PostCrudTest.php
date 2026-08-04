<?php

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;

describe('Posts - CRUD (authenticated)', function () {
    it('allows author to create a post', function () {
        $author = authorUser();
        $cat = Category::factory()->create();
        $tag = Tag::factory()->create();
        $this->actingAs($author);

        $this->postJson('/api/posts', [
            'title' => 'New Post',
            'excerpt' => 'Short summary',
            'content' => 'Full content here',
            'status' => 'published',
            'published_at' => now()->toISOString(),
            'categories' => [$cat->id],
            'tags' => [$tag->id],
        ])
            ->assertCreated()
            ->assertJsonPath('post.title', 'New Post')
            ->assertJsonPath('post.author.id', $author->id);
    });

    it('auto-generates slug on create', function () {
        $author = authorUser();
        $this->actingAs($author);

        $this->postJson('/api/posts', [
            'title' => 'My New Blog Post',
            'content' => 'Content',
            'status' => 'draft',
        ])
            ->assertCreated()
            ->assertJsonPath('post.slug', 'my-new-blog-post');
    });

    it('syncs categories and tags on create', function () {
        $author = authorUser();
        $cats = Category::factory(2)->create();
        $tags = Tag::factory(3)->create();
        $this->actingAs($author);

        $this->postJson('/api/posts', [
            'title' => 'Post with relations',
            'content' => 'Content',
            'status' => 'published',
            'published_at' => now()->toISOString(),
            'categories' => $cats->pluck('id')->toArray(),
            'tags' => $tags->pluck('id')->toArray(),
        ])->assertCreated();

        $post = Post::where('title', 'Post with relations')->first();
        expect($post->categories)->toHaveCount(2);
        expect($post->tags)->toHaveCount(3);
    });

    it('prevents reader from creating post', function () {
        $reader = readerUser();
        $this->actingAs($reader);

        $this->withExceptionHandling()->postJson('/api/posts', [
            'title' => 'Forbidden',
            'content' => 'Content',
            'status' => 'draft',
        ])->assertForbidden();
    });

    it('prevents unauthenticated user from creating post', function () {
        $this->withExceptionHandling()->postJson('/api/posts', [
            'title' => 'No Auth',
            'content' => 'Content',
            'status' => 'draft',
        ])->assertUnauthorized();
    });

    it('validates required fields on create', function () {
        $author = authorUser();
        $this->actingAs($author);

        $this->withExceptionHandling()->postJson('/api/posts', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'content', 'status']);
    });

    it('allows author to update own post', function () {
        $author = authorUser();
        $post = Post::factory()->create(['author_id' => $author->id]);
        $this->actingAs($author);

        $this->putJson("/api/posts/{$post->id}", [
            'title' => 'Updated Title',
        ])
            ->assertOk()
            ->assertJsonPath('post.title', 'Updated Title');
    });

    it('allows admin to update any post', function () {
        $admin = adminUser();
        $post = Post::factory()->create();
        $this->actingAs($admin);

        $this->putJson("/api/posts/{$post->id}", [
            'title' => 'Admin Updated',
        ])
            ->assertOk()
            ->assertJsonPath('post.title', 'Admin Updated');
    });

    it('prevents author from updating others post', function () {
        $author = authorUser();
        $other = User::factory()->create();
        $post = Post::factory()->create(['author_id' => $other->id]);
        $this->actingAs($author);

        $this->withExceptionHandling()->putJson("/api/posts/{$post->id}", [
            'title' => 'Hack',
        ])->assertForbidden();
    });

    it('syncs categories on update', function () {
        $author = authorUser();
        $post = Post::factory()->create(['author_id' => $author->id]);
        $cats = Category::factory(2)->create();
        $this->actingAs($author);

        $this->putJson("/api/posts/{$post->id}", [
            'categories' => $cats->pluck('id')->toArray(),
        ])->assertOk();

        expect($post->fresh()->categories)->toHaveCount(2);
    });

    it('syncs tags on update', function () {
        $author = authorUser();
        $post = Post::factory()->create(['author_id' => $author->id]);
        $tags = Tag::factory(2)->create();
        $this->actingAs($author);

        $this->putJson("/api/posts/{$post->id}", [
            'tags' => $tags->pluck('id')->toArray(),
        ])->assertOk();

        expect($post->fresh()->tags)->toHaveCount(2);
    });

    it('allows author to delete own post', function () {
        $author = authorUser();
        $post = Post::factory()->create(['author_id' => $author->id]);
        $this->actingAs($author);

        $this->deleteJson("/api/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Post deleted');

        expect(Post::find($post->id))->toBeNull();
    });

    it('allows admin to delete any post', function () {
        $admin = adminUser();
        $post = Post::factory()->create();
        $this->actingAs($admin);

        $this->deleteJson("/api/posts/{$post->id}")->assertOk();
    });

    it('prevents author from deleting others post', function () {
        $author = authorUser();
        $other = User::factory()->create();
        $post = Post::factory()->create(['author_id' => $other->id]);
        $this->actingAs($author);

        $this->withExceptionHandling()->deleteJson("/api/posts/{$post->id}")
            ->assertForbidden();
    });
});
