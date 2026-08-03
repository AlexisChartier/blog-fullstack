<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;

describe('Comments API', function () {
    it('creates a comment on a post', function () {
        $user = User::factory()->create();
        $post = Post::factory()->create([
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
        $this->actingAs($user);

        $this->postJson("/api/posts/{$post->id}/comments", [
            'content' => 'Great article!',
        ])
            ->assertCreated()
            ->assertJsonPath('comment.content', 'Great article!')
            ->assertJsonPath('comment.user.id', $user->id);
    });

    it('creates a reply to a comment', function () {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        $parent = Comment::factory()->create(['post_id' => $post->id]);
        $this->actingAs($user);

        $this->postJson("/api/posts/{$post->id}/comments", [
            'content' => 'Reply to comment',
            'parent_id' => $parent->id,
        ])
            ->assertCreated()
            ->assertJsonPath('comment.parent_id', $parent->id);
    });

    it('validates content is required', function () {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        $this->actingAs($user);

        $this->withExceptionHandling()->postJson("/api/posts/{$post->id}/comments", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['content']);
    });

    it('validates content min length', function () {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        $this->actingAs($user);

        $this->withExceptionHandling()->postJson("/api/posts/{$post->id}/comments", [
            'content' => 'a',
        ])->assertJsonValidationErrors(['content']);
    });

    it('validates content max length', function () {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        $this->actingAs($user);

        $this->withExceptionHandling()->postJson("/api/posts/{$post->id}/comments", [
            'content' => str_repeat('x', 1001),
        ])->assertJsonValidationErrors(['content']);
    });

    it('requires authentication', function () {
        $post = Post::factory()->create();

        $this->withExceptionHandling()->postJson("/api/posts/{$post->id}/comments", [
            'content' => 'Anonymous',
        ])->assertUnauthorized();
    });

    it('allows user to delete own comment', function () {
        $user = User::factory()->create();
        $comment = Comment::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $this->deleteJson("/api/comments/{$comment->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Comment deleted');

        expect(Comment::find($comment->id))->toBeNull();
    });

    it('allows admin to delete any comment', function () {
        $admin = adminUser();
        $comment = Comment::factory()->create();
        $this->actingAs($admin);

        $this->deleteJson("/api/comments/{$comment->id}")->assertOk();
    });

    it('prevents user from deleting others comment', function () {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $comment = Comment::factory()->create(['user_id' => $other->id]);
        $this->actingAs($user);

        $this->withExceptionHandling()->deleteJson("/api/comments/{$comment->id}")
            ->assertForbidden();
    });
});
