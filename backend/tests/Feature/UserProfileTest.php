<?php

use App\Models\Post;
use App\Models\User;

describe('User Profile API', function () {
    it('shows a user profile by username', function () {
        $user = User::factory()->create([
            'username' => 'johndoe',
            'bio' => 'Software developer',
        ]);

        $this->getJson('/api/users/johndoe')
            ->assertOk()
            ->assertJsonPath('data.username', 'johndoe')
            ->assertJsonPath('data.bio', 'Software developer');
    });

    it('includes published posts in profile', function () {
        $user = User::factory()->create(['username' => 'author1']);
        Post::factory(3)->create([
            'author_id' => $user->id,
            'status' => 'published',
            'published_at' => now()->subDays(rand(1, 10)),
        ]);

        $response = $this->getJson('/api/users/author1')
            ->assertOk();

        expect($response->json('data.posts'))->toHaveCount(3);
    });

    it('returns 404 for unknown user', function () {
        $this->withExceptionHandling()->getJson('/api/users/nonexistent')
            ->assertNotFound();
    });

    it('does not expose email publicly', function () {
        User::factory()->create([
            'username' => 'private',
            'email' => 'secret@example.com',
        ]);

        $response = $this->getJson('/api/users/private')
            ->assertOk();

        expect($response->json('data.email'))->toBeNull();
    });
});

describe('User Posts API', function () {
    it('lists user posts paginated', function () {
        $user = User::factory()->create(['username' => 'blogger']);
        Post::factory(15)->create([
            'author_id' => $user->id,
            'status' => 'published',
            'published_at' => now()->subDays(rand(1, 30)),
        ]);

        $this->getJson('/api/users/blogger/posts')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => ['current_page', 'last_page', 'total'],
            ]);
    });
});
