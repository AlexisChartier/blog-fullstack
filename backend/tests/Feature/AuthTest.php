<?php

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use App\Models\UserSession;

describe('Auth - Register', function () {
    it('registers a new user successfully', function () {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'username' => 'johndoe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'username', 'email'],
            ]);

        expect(User::where('email', 'john@example.com')->exists())->toBeTrue();
    });

    it('assigns reader role on registration', function () {
        $this->postJson('/api/auth/register', [
            'name' => 'Jane',
            'username' => 'jane',
            'email' => 'jane@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $user = User::where('email', 'jane@example.com')->first();
        expect($user->hasRole('reader'))->toBeTrue();
    });

    it('validates required fields', function () {
        $this->withExceptionHandling()->postJson('/api/auth/register', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'username', 'email', 'password']);
    });

    it('validates unique email', function () {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->withExceptionHandling()->postJson('/api/auth/register', [
            'name' => 'Test',
            'username' => 'testuser',
            'email' => 'taken@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertJsonValidationErrors(['email']);
    });

    it('validates unique username', function () {
        User::factory()->create(['username' => 'taken']);

        $this->withExceptionHandling()->postJson('/api/auth/register', [
            'name' => 'Test',
            'username' => 'taken',
            'email' => 'new@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertJsonValidationErrors(['username']);
    });

    it('validates password confirmation', function () {
        $this->withExceptionHandling()->postJson('/api/auth/register', [
            'name' => 'Test',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword!',
        ])->assertJsonValidationErrors(['password']);
    });
});

describe('Auth - Login', function () {
    it('logs in a user successfully', function () {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $response = $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'user']);
    });

    it('fails with invalid credentials', function () {
        User::factory()->create([
            'email' => 'login@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'wrongpassword',
        ])->assertStatus(401);
    });

    it('validates required fields', function () {
        $this->withExceptionHandling()->postJson('/api/auth/login', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    });
});

describe('Auth - Me', function () {
    it('returns current user when authenticated', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    });

    it('returns 401 when not authenticated', function () {
        $this->withExceptionHandling()->getJson('/api/auth/me')
            ->assertUnauthorized();
    });
});

describe('Auth - Logout', function () {
    it('logs out successfully', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->withExceptionHandling()->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out');
    });

    it('requires authentication', function () {
        $this->withExceptionHandling()->postJson('/api/auth/logout')
            ->assertUnauthorized();
    });

    it('clears session on logout', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        UserSession::create([
            'user_id' => $user->id,
            'session_id' => 'some-session',
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/logout')
            ->assertOk();

        expect(UserSession::where('user_id', $user->id)->exists())->toBeFalse();
    });
});

describe('Auth - Session Management', function () {
    it('stores session on login', function () {
        $user = User::factory()->create([
            'email' => 'session@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'session@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        expect(UserSession::where('user_id', $user->id)->exists())->toBeTrue();
    });

    it('stores session on register', function () {
        $this->withExceptionHandling()->postJson('/api/auth/register', [
            'name' => 'Session User',
            'username' => 'sessionuser',
            'email' => 'sessionuser@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $user = User::where('email', 'sessionuser@example.com')->first();
        expect(UserSession::where('user_id', $user->id)->exists())->toBeTrue();
    });

    it('regenerates session on login', function () {
        $user = User::factory()->create([
            'email' => 'regen@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        UserSession::create([
            'user_id' => $user->id,
            'session_id' => 'old-session-id',
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'regen@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        expect(UserSession::where('user_id', $user->id)->first()->session_id)->not->toBe('old-session-id');
    });

    it('returns user with roles on login', function () {
        $user = User::factory()->create([
            'email' => 'roles@example.com',
            'password' => bcrypt('Password123!'),
        ]);
        $user->assignRole('reader');

        $response = $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'roles@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $roles = collect($response->json('user.roles'));
        expect($roles->contains('reader'))->toBeTrue();
    });

    it('returns user with roles on register', function () {
        $response = $this->withExceptionHandling()->postJson('/api/auth/register', [
            'name' => 'Role User',
            'username' => 'roleuser',
            'email' => 'roleuser@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $roles = collect($response->json('user.roles'));
        expect($roles->contains('reader'))->toBeTrue();
    });

    it('returns user with roles on me endpoint', function () {
        $user = User::factory()->create();
        $user->assignRole('author');
        $this->actingAs($user);

        $response = $this->getJson('/api/auth/me')->assertOk();

        $roles = collect($response->json('user.roles'));
        expect($roles->contains('author'))->toBeTrue();
    });
});

describe('Auth - My Posts', function () {
    it('returns paginated posts for the authenticated user', function () {
        $user = User::factory()->create();
        Post::factory()->count(3)->create(['author_id' => $user->id, 'status' => 'published']);
        $this->actingAs($user);

        $response = $this->getJson('/api/auth/my-posts')->assertOk();

        expect($response->json('data'))->toHaveCount(3);
        expect($response->json('meta.total'))->toBe(3);
    });

    it('includes draft posts not visible on public listing', function () {
        $user = User::factory()->create();
        Post::factory()->create(['author_id' => $user->id, 'status' => 'draft']);
        Post::factory()->create(['author_id' => $user->id, 'status' => 'published']);
        $this->actingAs($user);

        $response = $this->getJson('/api/auth/my-posts')->assertOk();

        expect($response->json('data'))->toHaveCount(2);
    });

    it('only returns the authenticated user posts', function () {
        $user = User::factory()->create();
        $other = User::factory()->create();
        Post::factory()->create(['author_id' => $user->id, 'status' => 'published']);
        Post::factory()->create(['author_id' => $other->id, 'status' => 'published']);
        $this->actingAs($user);

        $response = $this->getJson('/api/auth/my-posts')->assertOk();

        expect($response->json('data'))->toHaveCount(1);
    });

    it('returns 401 when unauthenticated', function () {
        $this->withExceptionHandling()->getJson('/api/auth/my-posts')->assertUnauthorized();
    });

    it('eager loads categories and tags', function () {
        $user = User::factory()->create();
        $post = Post::factory()->create(['author_id' => $user->id, 'status' => 'published']);
        $category = Category::factory()->create();
        $tag = Tag::factory()->create();
        $post->categories()->attach($category);
        $post->tags()->attach($tag);
        $this->actingAs($user);

        $response = $this->getJson('/api/auth/my-posts')->assertOk();

        expect($response->json('data.0.categories'))->toHaveCount(1);
        expect($response->json('data.0.tags'))->toHaveCount(1);
    });
});

describe('Auth - My Post (single)', function () {
    it('returns a single post by id for the authenticated user', function () {
        $user = authorUser();
        $post = Post::factory()->create(['author_id' => $user->id, 'status' => 'draft']);
        $this->actingAs($user);

        $response = $this->getJson("/api/auth/my-posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $post->id)
            ->assertJsonPath('data.title', $post->title);
    });

    it('returns 403 when accessing another user post', function () {
        $user = authorUser();
        $other = authorUser();
        $post = Post::factory()->create(['author_id' => $other->id]);
        $this->actingAs($user);

        $this->withExceptionHandling()->getJson("/api/auth/my-posts/{$post->id}")
            ->assertForbidden();
    });

    it('allows admin to access any post', function () {
        $admin = adminUser();
        $other = authorUser();
        $post = Post::factory()->create(['author_id' => $other->id]);
        $this->actingAs($admin);

        $this->getJson("/api/auth/my-posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $post->id);
    });

    it('eager loads categories and tags', function () {
        $user = authorUser();
        $post = Post::factory()->create(['author_id' => $user->id]);
        $category = Category::factory()->create();
        $tag = Tag::factory()->create();
        $post->categories()->attach($category);
        $post->tags()->attach($tag);
        $this->actingAs($user);

        $response = $this->getJson("/api/auth/my-posts/{$post->id}")->assertOk();

        expect($response->json('data.categories'))->toHaveCount(1);
        expect($response->json('data.tags'))->toHaveCount(1);
    });

    it('returns 401 when unauthenticated', function () {
        $post = Post::factory()->create();

        $this->withExceptionHandling()->getJson("/api/auth/my-posts/{$post->id}")
            ->assertUnauthorized();
    });
});
