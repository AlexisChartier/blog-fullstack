<?php

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Support\Facades\Auth;

describe('EnsureSingleSession Middleware', function () {
    it('creates session on first authenticated request', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        expect(UserSession::where('user_id', $user->id)->exists())->toBeFalse();

        $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'username' => $user->username,
        ])->assertOk();

        expect(UserSession::where('user_id', $user->id)->exists())->toBeTrue();
    });

    it('rejects request when stored session differs from request session', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        UserSession::create([
            'user_id' => $user->id,
            'session_id' => 'different-session-id',
        ]);

        $response = $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => 'Second Update',
            'username' => $user->username,
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('message', 'Your session has been terminated because you logged in from another device.');
    });

    it('logs out user and invalidates session on mismatch', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        UserSession::create([
            'user_id' => $user->id,
            'session_id' => 'different-session-id',
        ]);

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => 'Second Update',
            'username' => $user->username,
        ])->assertUnauthorized();

        expect(Auth::check())->toBeFalse();
    });

    it('does not interfere with unauthenticated requests', function () {
        $this->getJson('/api/posts')->assertOk();
    });

    it('regenerates session id on new login', function () {
        $user = User::factory()->create([
            'email' => 'session@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'session@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $firstSessionId = UserSession::where('user_id', $user->id)->first()->session_id;
        expect($firstSessionId)->not->toBeNull();

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'session@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $secondSessionId = UserSession::where('user_id', $user->id)->first()->session_id;
        expect($secondSessionId)->not->toBe($firstSessionId);
    });

    it('allows access to protected route after fresh login', function () {
        User::factory()->create([
            'email' => 'relogin@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'relogin@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        expect(UserSession::count())->toBe(1);
    });

    it('deletes old session and creates new one on re-login', function () {
        $user = User::factory()->create([
            'email' => 'replace@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'replace@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        expect(UserSession::where('user_id', $user->id)->count())->toBe(1);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'replace@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        expect(UserSession::where('user_id', $user->id)->count())->toBe(1);
    });

    it('clears session on logout', function () {
        $user = User::factory()->create([
            'email' => 'logout@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'logout@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        expect(UserSession::where('user_id', $user->id)->exists())->toBeTrue();

        $this->withExceptionHandling()->postJson('/api/auth/logout')
            ->assertOk();

        expect(UserSession::where('user_id', $user->id)->exists())->toBeFalse();
    });
});
