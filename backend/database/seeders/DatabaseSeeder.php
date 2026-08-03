<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRolesAndPermissions();

        $admin = User::factory()->create([
            'name' => 'Admin User',
            'username' => 'admin',
            'email' => 'admin@example.com',
            'bio' => 'Platform administrator and curator.',
        ]);
        $admin->assignRole('admin');

        $authors = User::factory(4)->create()->each(function (User $user) {
            $user->assignRole('author');
        });

        $reader = User::factory()->create([
            'name' => 'Reader User',
            'username' => 'reader',
            'email' => 'reader@example.com',
        ]);
        $reader->assignRole('reader');

        $categories = Category::factory(8)->create();
        $tags = Tag::factory(15)->create();

        $allUsers = collect([$admin])->merge($authors);

        $posts = Post::factory(20)
            ->recycle($allUsers)
            ->create()
            ->each(function (Post $post) use ($categories, $tags, $allUsers) {
                $post->categories()->attach($categories->random(rand(1, 3))->pluck('id'));
                $post->tags()->attach($tags->random(rand(1, 5))->pluck('id'));

                Comment::factory(rand(2, 8))
                    ->recycle($post)
                    ->recycle($allUsers)
                    ->create()
                    ->each(function (Comment $comment) use ($allUsers) {
                        if (fake()->boolean(30)) {
                            Comment::factory(rand(1, 3))
                                ->recycle($comment->post)
                                ->recycle($allUsers)
                                ->create(['parent_id' => $comment->id]);
                        }
                    });
            });

        Post::factory(3)->draft()->recycle($allUsers)->create();
    }

    private function seedRolesAndPermissions(): void
    {
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $author = Role::firstOrCreate(['name' => 'author']);
        $reader = Role::firstOrCreate(['name' => 'reader']);

        $permissions = [
            'create posts',
            'edit own posts',
            'delete own posts',
            'create comments',
            'delete own comments',
            'manage all posts',
            'manage all comments',
            'manage users',
            'manage categories',
            'manage tags',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        $admin->syncPermissions(Permission::all());
        $author->syncPermissions(['create posts', 'edit own posts', 'delete own posts', 'create comments', 'delete own comments']);
        $reader->syncPermissions(['create comments', 'delete own comments']);
    }
}
