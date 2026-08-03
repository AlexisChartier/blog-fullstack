<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase as BaseTestCase;

uses(BaseTestCase::class, RefreshDatabase::class)
    ->beforeEach(function () {
        // Seed roles and permissions for testing
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $author = Role::firstOrCreate(['name' => 'author']);
        $reader = Role::firstOrCreate(['name' => 'reader']);

        $permissions = [
            'create posts', 'edit own posts', 'delete own posts',
            'create comments', 'delete own comments',
            'manage all posts', 'manage all comments',
            'manage users', 'manage categories', 'manage tags',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        $admin->syncPermissions(Permission::all());
        $author->syncPermissions(['create posts', 'edit own posts', 'delete own posts', 'create comments', 'delete own comments']);
        $reader->syncPermissions(['create comments', 'delete own comments']);
    })
    ->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Helper functions
|--------------------------------------------------------------------------
*/

function adminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

function authorUser(): User
{
    $user = User::factory()->create();
    $user->assignRole('author');

    return $user;
}

function readerUser(): User
{
    $user = User::factory()->create();
    $user->assignRole('reader');

    return $user;
}
