<?php

use App\Models\Comment;
use App\Models\User;
use App\Policies\CommentPolicy;

describe('CommentPolicy', function () {
    it('allows admin to delete any comment', function () {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $comment = Comment::factory()->create(['user_id' => User::factory()->create()->id]);

        expect((new CommentPolicy)->delete($admin, $comment))->toBeTrue();
    });

    it('allows user to delete own comment', function () {
        $user = User::factory()->create();
        $comment = Comment::factory()->create(['user_id' => $user->id]);

        expect((new CommentPolicy)->delete($user, $comment))->toBeTrue();
    });

    it('prevents user from deleting others comment', function () {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $comment = Comment::factory()->create(['user_id' => $other->id]);

        expect((new CommentPolicy)->delete($user, $comment))->toBeFalse();
    });
});
