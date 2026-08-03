<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;

describe('Comment Model', function () {
    it('belongs to post', function () {
        $post = Post::factory()->create();
        $comment = Comment::factory()->create(['post_id' => $post->id]);

        expect($comment->post->id)->toBe($post->id);
    });

    it('belongs to user', function () {
        $user = User::factory()->create();
        $comment = Comment::factory()->create(['user_id' => $user->id]);

        expect($comment->user->id)->toBe($user->id);
    });

    it('has replies relation (self-referencing)', function () {
        $parent = Comment::factory()->create();
        $reply = Comment::factory()->create([
            'parent_id' => $parent->id,
        ]);

        expect($parent->replies)->toHaveCount(1);
        expect($parent->replies->first()->id)->toBe($reply->id);
    });

    it('belongs to parent comment', function () {
        $parent = Comment::factory()->create();
        $reply = Comment::factory()->create(['parent_id' => $parent->id]);

        expect($reply->parent->id)->toBe($parent->id);
    });

    it('scopeApproved returns only approved comments', function () {
        $approved = Comment::factory()->create(['is_approved' => true]);
        $unapproved = Comment::factory()->create(['is_approved' => false]);

        $results = Comment::approved()->get();

        expect($results->contains($approved->id))->toBeTrue();
        expect($results->contains($unapproved->id))->toBeFalse();
    });
});
