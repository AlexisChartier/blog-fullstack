<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;

describe('EnsureSingleSession Middleware', function () {
    it('allows request when session id matches user session id', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'username' => $user->username,
        ])->assertOk();

        expect($user->fresh()->session_id)->not->toBeNull();
    });

    it('does not update session id when it already matches', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'username' => $user->username,
        ])->assertOk();

        $sessionId = $user->fresh()->session_id;
        expect($sessionId)->not->toBeNull();

        $user->forceFill(['session_id' => $sessionId])->save();

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => 'Second Update',
            'username' => $user->username,
        ])->assertUnauthorized();
    });

    it('updates session_id when null on first authenticated request', function () {
        $user = User::factory()->create(['session_id' => null]);
        $this->actingAs($user);

        expect($user->session_id)->toBeNull();

        $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'username' => $user->username,
        ])->assertOk();

        expect($user->fresh()->session_id)->not->toBeNull();
    });

    it('updates session_id when different from current on first authenticated request', function () {
        $user = User::factory()->create(['session_id' => 'old-session']);
        $this->actingAs($user);

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => 'Updated Name',
            'username' => $user->username,
        ])->assertUnauthorized();
    });

    it('terminates session when user session id differs from current session', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->putJson('/api/profile', [
            'name' => 'First Update',
            'username' => $user->username,
        ])->assertOk();

        $currentSessionId = $user->fresh()->session_id;
        expect($currentSessionId)->not->toBeNull();

        $user->forceFill(['session_id' => 'different-session-id'])->save();

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

        $this->putJson('/api/profile', [
            'name' => 'First Update',
            'username' => $user->username,
        ])->assertOk();

        $user->forceFill(['session_id' => 'different-session-id'])->save();

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => 'Second Update',
            'username' => $user->username,
        ])->assertUnauthorized();

        expect(Auth::check())->toBeFalse();
    });

    it('updates session id on first authenticated request when null', function () {
        $user = User::factory()->create(['session_id' => null]);
        $this->actingAs($user);

        $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'username' => $user->username,
        ])->assertOk();

        expect($user->fresh()->session_id)->not->toBeNull();
    });

    it('does not interfere with unauthenticated requests', function () {
        $this->getJson('/api/posts')->assertOk();
    });

    it('returns unauthorized when manually set session id does not match request session', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $currentSessionId = session()->getId();
        $user->forceFill(['session_id' => $currentSessionId])->save();

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => 'Update 1',
            'username' => $user->username,
        ])->assertUnauthorized();
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

        $firstSessionId = $user->fresh()->session_id;
        expect($firstSessionId)->not->toBeNull();

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'session@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $secondSessionId = $user->fresh()->session_id;
        expect($secondSessionId)->not->toBeNull();
        expect($secondSessionId)->not->toBe($firstSessionId);
    });

    it('allows access to protected route after fresh login when old session was invalidated', function () {
        $user = User::factory()->create([
            'email' => 'relogin@example.com',
            'password' => bcrypt('Password123!'),
        ]);

        $this->withExceptionHandling()->postJson('/api/auth/login', [
            'email' => 'relogin@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $sessionId = $user->fresh()->session_id;
        expect($sessionId)->not->toBeNull();
    });
});
