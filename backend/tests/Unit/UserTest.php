<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Carbon;

describe('User Model', function () {
    it('has posts relation', function () {
        $user = User::factory()->create();
        $post = Post::factory()->create(['author_id' => $user->id]);

        expect($user->posts)->toHaveCount(1);
        expect($user->posts->first()->id)->toBe($post->id);
    });

    it('has comments relation', function () {
        $user = User::factory()->create();
        $post = Post::factory()->create(['author_id' => $user->id]);
        $comment = Comment::factory()->create([
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        expect($user->comments)->toHaveCount(1);
        expect($user->comments->first()->id)->toBe($comment->id);
    });

    it('checks admin role', function () {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        expect($admin->isAdmin())->toBeTrue();
        expect($admin->isAuthor())->toBeTrue();
    });

    it('checks author role', function () {
        $author = User::factory()->create();
        $author->assignRole('author');

        expect($author->isAdmin())->toBeFalse();
        expect($author->isAuthor())->toBeTrue();
    });

    it('checks reader role is not author', function () {
        $reader = User::factory()->create();
        $reader->assignRole('reader');

        expect($reader->isAdmin())->toBeFalse();
        expect($reader->isAuthor())->toBeFalse();
    });

    it('hides password and remember token', function () {
        $user = User::factory()->create();
        $array = $user->toArray();

        expect($array)->not->toHaveKey('password');
        expect($array)->not->toHaveKey('remember_token');
    });

    it('casts password as hashed', function () {
        $user = User::factory()->create(['password' => 'plain-text']);
        expect(Hash::check('plain-text', $user->password))->toBeTrue();
    });

    it('casts email_verified_at as datetime', function () {
        $user = User::factory()->create([
            'email_verified_at' => '2025-01-01 12:00:00',
        ]);

        expect($user->email_verified_at)->toBeInstanceOf(Carbon::class);
    });
});
