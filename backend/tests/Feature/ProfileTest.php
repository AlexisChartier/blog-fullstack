<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

describe('Profile Update API', function () {
    it('updates profile name and bio', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'username' => $user->username,
            'bio' => 'New bio text',
        ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Name')
            ->assertJsonPath('user.bio', 'New bio text');
    });

    it('updates username', function () {
        $user = User::factory()->create(['username' => 'oldname']);
        Sanctum::actingAs($user);

        $this->putJson('/api/profile', [
            'name' => $user->name,
            'username' => 'newname',
        ])
            ->assertOk()
            ->assertJsonPath('user.username', 'newname');
    });

    it('validates unique username on update', function () {
        $user = User::factory()->create(['username' => 'user1']);
        User::factory()->create(['username' => 'taken']);
        Sanctum::actingAs($user);

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => $user->name,
            'username' => 'taken',
        ])->assertJsonValidationErrors(['username']);
    });

    it('allows keeping own username', function () {
        $user = User::factory()->create(['username' => 'myusername']);
        Sanctum::actingAs($user);

        $this->putJson('/api/profile', [
            'name' => $user->name,
            'username' => 'myusername',
        ])->assertOk();
    });

    it('validates required fields', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->withExceptionHandling()->putJson('/api/profile', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'username']);
    });

    it('requires authentication', function () {
        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => 'Test',
            'username' => 'test',
        ])->assertUnauthorized();
    });

    it('validates bio max length', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => $user->name,
            'username' => $user->username,
            'bio' => str_repeat('x', 501),
        ])->assertJsonValidationErrors(['bio']);
    });
});
