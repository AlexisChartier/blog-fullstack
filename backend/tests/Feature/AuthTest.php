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
});
