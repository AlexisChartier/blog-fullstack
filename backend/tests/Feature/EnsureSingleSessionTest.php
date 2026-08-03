<?php

use App\Models\User;

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
});
