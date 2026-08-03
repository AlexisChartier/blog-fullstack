<?php

use App\Models\Post;
use App\Models\User;
use App\Policies\PostPolicy;

describe('PostPolicy', function () {
    it('allows admin to update any post', function () {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $post = Post::factory()->create(['author_id' => User::factory()->create()->id]);

        expect((new PostPolicy)->update($admin, $post))->toBeTrue();
    });

    it('allows author to update own post', function () {
        $author = User::factory()->create();
        $author->assignRole('author');
        $post = Post::factory()->create(['author_id' => $author->id]);

        expect((new PostPolicy)->update($author, $post))->toBeTrue();
    });

    it('prevents author from updating others post', function () {
        $author = User::factory()->create();
        $author->assignRole('author');
        $other = User::factory()->create();
        $post = Post::factory()->create(['author_id' => $other->id]);

        expect((new PostPolicy)->update($author, $post))->toBeFalse();
    });

    it('allows admin to delete any post', function () {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $post = Post::factory()->create(['author_id' => User::factory()->create()->id]);

        expect((new PostPolicy)->delete($admin, $post))->toBeTrue();
    });

    it('allows author to delete own post', function () {
        $author = User::factory()->create();
        $author->assignRole('author');
        $post = Post::factory()->create(['author_id' => $author->id]);

        expect((new PostPolicy)->delete($author, $post))->toBeTrue();
    });

    it('prevents author from deleting others post', function () {
        $author = User::factory()->create();
        $author->assignRole('author');
        $other = User::factory()->create();
        $post = Post::factory()->create(['author_id' => $other->id]);

        expect((new PostPolicy)->delete($author, $post))->toBeFalse();
    });
});
