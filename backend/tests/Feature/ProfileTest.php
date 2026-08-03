<?php

use App\Models\User;
use Illuminate\Http\Testing\File as TestingFile;
use Illuminate\Support\Facades\Storage;

describe('Profile Update API', function () {
    it('updates profile name and bio', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

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
        $this->actingAs($user);

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
        $this->actingAs($user);

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => $user->name,
            'username' => 'taken',
        ])->assertJsonValidationErrors(['username']);
    });

    it('allows keeping own username', function () {
        $user = User::factory()->create(['username' => 'myusername']);
        $this->actingAs($user);

        $this->putJson('/api/profile', [
            'name' => $user->name,
            'username' => 'myusername',
        ])->assertOk();
    });

    it('validates required fields', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

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
        $this->actingAs($user);

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => $user->name,
            'username' => $user->username,
            'bio' => str_repeat('x', 501),
        ])->assertJsonValidationErrors(['bio']);
    });
});

describe('Profile Avatar Upload', function () {
    beforeEach(function () {
        Storage::fake('public');
    });

    it('uploads avatar and stores path', function () {
        $user = User::factory()->create(['avatar_url' => null]);
        $this->actingAs($user);

        $file = TestingFile::image('avatar.jpg', 100, 100);

        $this->putJson('/api/profile', [
            'name' => $user->name,
            'username' => $user->username,
        ] + ['avatar' => $file])
            ->assertOk()
            ->assertJsonPath('user.avatar_url', "avatars/{$file->hashName()}");

        Storage::disk('public')->assertExists("avatars/{$file->hashName()}");
    });

    it('deletes old avatar when uploading a new one', function () {
        $oldFile = TestingFile::image('old-avatar.jpg', 100, 100);
        $oldPath = $oldFile->store('avatars', 'public');
        $user = User::factory()->create(['avatar_url' => $oldPath]);
        $this->actingAs($user);

        Storage::disk('public')->assertExists($oldPath);

        $newFile = TestingFile::image('new-avatar.jpg', 100, 100);

        $this->putJson('/api/profile', [
            'name' => $user->name,
            'username' => $user->username,
        ] + ['avatar' => $newFile])
            ->assertOk();

        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists("avatars/{$newFile->hashName()}");
    });

    it('validates avatar is an image', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => TestingFile::create('not-an-image.pdf', 100),
        ])->assertJsonValidationErrors(['avatar']);
    });

    it('validates avatar max size', function () {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->withExceptionHandling()->putJson('/api/profile', [
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => TestingFile::image('avatar.jpg', 100, 100)->size(3000),
        ])->assertJsonValidationErrors(['avatar']);
    });
});
