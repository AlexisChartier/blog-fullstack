<?php

use App\Models\User;

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

    it('clears session_id on logout', function () {
        $user = User::factory()->create(['session_id' => 'some-session']);
        $this->actingAs($user);

        $this->withExceptionHandling()->postJson('/api/auth/logout')
            ->assertOk();

        expect($user->fresh()->session_id)->toBeNull();
    });
});

describe('Auth - Session Management', function () {
    it('stores session_id on login', function () {
        $user = User::factory()->create([
            'email' => 'session@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'session@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        expect($user->fresh()->session_id)->not->toBeNull();
    });

    it('stores session_id on register', function () {
        $this->withExceptionHandling()->postJson('/api/auth/register', [
            'name' => 'Session User',
            'username' => 'sessionuser',
            'email' => 'sessionuser@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $user = User::where('email', 'sessionuser@example.com')->first();
        expect($user->session_id)->not->toBeNull();
    });

    it('regenerates session on login', function () {
        $user = User::factory()->create([
            'email' => 'regen@example.com',
            'password' => bcrypt('Password123!'),
            'session_id' => 'old-session-id',
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'regen@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        expect($user->fresh()->session_id)->not->toBe('old-session-id');
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
        expect($roles->contains('name', 'reader'))->toBeTrue();
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
        expect($roles->contains('name', 'reader'))->toBeTrue();
    });

    it('returns user with roles on me endpoint', function () {
        $user = User::factory()->create();
        $user->assignRole('author');
        $this->actingAs($user);

        $response = $this->getJson('/api/auth/me')->assertOk();

        $roles = collect($response->json('user.roles'));
        expect($roles->contains('name', 'author'))->toBeTrue();
    });
});
