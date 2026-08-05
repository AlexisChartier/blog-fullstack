<?php

use App\Models\Category;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;

describe('Admin Stats', function () {
    it('returns stats for admin', function () {
        $admin = adminUser();
        User::factory(3)->create();
        Post::factory(5)->create();
        Post::factory(2)->draft()->create();
        Comment::factory(10)->create();
        Comment::factory(4)->unapproved()->create();
        Category::factory(3)->create();
        Tag::factory(5)->create();

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/stats')->assertOk();

        expect($response->json('data.users'))->toBeGreaterThanOrEqual(4);
        expect($response->json('data.posts'))->toBeGreaterThanOrEqual(7);
        expect($response->json('data.published_posts'))->toBeGreaterThanOrEqual(5);
        expect($response->json('data.draft_posts'))->toBeGreaterThanOrEqual(2);
        expect($response->json('data.comments'))->toBeGreaterThanOrEqual(14);
        expect($response->json('data.pending_comments'))->toBeGreaterThanOrEqual(4);
        expect($response->json('data.categories'))->toBeGreaterThanOrEqual(3);
        expect($response->json('data.tags'))->toBeGreaterThanOrEqual(5);
    });

    it('prevents non-admin from accessing stats', function () {
        $author = authorUser();

        $this->actingAs($author);

        $this->withExceptionHandling()->getJson('/api/admin/stats')->assertForbidden();
    });
});

describe('Admin All Posts', function () {
    it('lists all posts for admin', function () {
        $admin = adminUser();
        $author = authorUser();
        Post::factory(3)->create(['author_id' => $admin->id]);
        Post::factory(2)->create(['author_id' => $author->id]);

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/posts')->assertOk();

        expect($response->json('data'))->toHaveCount(5);
    });

    it('includes author relation', function () {
        $admin = adminUser();
        $author = authorUser();
        Post::factory()->create(['author_id' => $author->id]);

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/posts')->assertOk();

        expect($response->json('data.0.author'))->not->toBeNull();
    });

    it('prevents non-admin from accessing all posts', function () {
        $author = authorUser();

        $this->actingAs($author);

        $this->withExceptionHandling()->getJson('/api/admin/posts')->assertForbidden();
    });
});

describe('Admin Users', function () {
    it('lists all users for admin', function () {
        $admin = adminUser();
        User::factory(3)->create();

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/users')->assertOk();

        expect($response->json('data'))->toHaveCount(4);
    });

    it('includes roles and counts', function () {
        $admin = adminUser();
        $author = authorUser();
        Post::factory(2)->create(['author_id' => $author->id]);
        Comment::factory(3)->create(['user_id' => $author->id]);

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/users')->assertOk();

        $authorData = collect($response->json('data'))->firstWhere('id', $author->id);
        expect($authorData['roles'])->toContain('author');
        expect($authorData['posts_count'])->toBe(2);
        expect($authorData['comments_count'])->toBe(3);
    });

    it('prevents non-admin from accessing users list', function () {
        $author = authorUser();

        $this->actingAs($author);

        $this->withExceptionHandling()->getJson('/api/admin/users')->assertForbidden();
    });
});

describe('Admin User Role Update', function () {
    it('allows admin to change user role', function () {
        $admin = adminUser();
        $user = User::factory()->create();
        $user->assignRole('reader');

        $this->actingAs($admin);

        $this->putJson("/api/admin/users/{$user->id}/role", ['role' => 'author'])
            ->assertOk();

        expect($user->fresh()->hasRole('author'))->toBeTrue();
        expect($user->fresh()->hasRole('reader'))->toBeFalse();
    });

    it('prevents non-admin from changing roles', function () {
        $author = authorUser();
        $user = User::factory()->create();
        $user->assignRole('reader');

        $this->actingAs($author);

        $this->withExceptionHandling()->putJson("/api/admin/users/{$user->id}/role", ['role' => 'author'])
            ->assertForbidden();
    });

    it('validates role value', function () {
        $admin = adminUser();
        $user = User::factory()->create();

        $this->actingAs($admin);

        $this->withExceptionHandling()->putJson("/api/admin/users/{$user->id}/role", ['role' => 'superadmin'])
            ->assertUnprocessable();
    });
});
