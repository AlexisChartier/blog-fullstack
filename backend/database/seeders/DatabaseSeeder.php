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
            'bio' => 'Platform administrator and curator. Passionate about clean code, open source, and building communities around great writing.',
        ]);
        $admin->assignRole('admin');

        $authors = collect([
            User::factory()->create([
                'name' => 'Jane Doe',
                'username' => 'jane_doe',
                'email' => 'jane@example.com',
                'bio' => 'Full-stack developer and tech blogger. I write about Angular, Laravel, and everything web.',
            ]),
            User::factory()->create([
                'name' => 'Alex Chen',
                'username' => 'alex_chen',
                'email' => 'alex@example.com',
                'bio' => 'DevOps engineer turned writer. Sharing insights on Docker, CI/CD, and cloud architecture.',
            ]),
            User::factory()->create([
                'name' => 'Sarah Williams',
                'username' => 'sarah_w',
                'email' => 'sarah@example.com',
                'bio' => 'UX designer and front-end enthusiast. I bridge the gap between design and development.',
            ]),
            User::factory()->create([
                'name' => 'Marcus Johnson',
                'username' => 'marcusj',
                'email' => 'marcus@example.com',
                'bio' => 'Backend architect specializing in APIs and database optimization. Coffee addict.',
            ]),
            User::factory()->create([
                'name' => 'Emma Rodriguez',
                'username' => 'emma_r',
                'email' => 'emma@example.com',
                'bio' => 'Security researcher and ethical hacker. I help developers build safer apps.',
            ]),
            User::factory()->create([
                'name' => 'Liam OBrien',
                'username' => 'liamob',
                'email' => 'liam@example.com',
                'bio' => 'Mobile developer transitioning to full-stack. React Native, Flutter, and now Angular.',
            ]),
        ]);

        $authors->each(fn (User $user) => $user->assignRole('author'));

        $readers = collect([
            User::factory()->create([
                'name' => 'Reader User',
                'username' => 'reader',
                'email' => 'reader@example.com',
                'bio' => 'Just here to read great content.',
            ]),
            User::factory()->create([
                'name' => 'Chris Reader',
                'username' => 'chris_r',
                'email' => 'chris@example.com',
            ]),
            User::factory()->create([
                'name' => 'Pat Morgan',
                'username' => 'patmorgan',
                'email' => 'pat@example.com',
            ]),
        ]);

        $readers->each(fn (User $user) => $user->assignRole('reader'));

        $categories = collect([
            Category::factory()->create(['name' => 'Web Development', 'slug' => 'web-development', 'description' => 'Articles about modern web development, frameworks, and best practices.']),
            Category::factory()->create(['name' => 'Backend', 'slug' => 'backend', 'description' => 'Server-side development, APIs, databases, and architecture.']),
            Category::factory()->create(['name' => 'Frontend', 'slug' => 'frontend', 'description' => 'UI, UX, CSS, JavaScript, and client-side frameworks.']),
            Category::factory()->create(['name' => 'DevOps', 'slug' => 'devops', 'description' => 'Docker, CI/CD, cloud infrastructure, and deployment strategies.']),
            Category::factory()->create(['name' => 'Security', 'slug' => 'security', 'description' => 'Web security, authentication, and best practices for protecting your apps.']),
            Category::factory()->create(['name' => 'Testing', 'slug' => 'testing', 'description' => 'Unit testing, integration testing, E2E testing, and TDD.']),
            Category::factory()->create(['name' => 'Tutorials', 'slug' => 'tutorials', 'description' => 'Step-by-step guides and tutorials for developers.']),
            Category::factory()->create(['name' => 'Architecture', 'slug' => 'architecture', 'description' => 'Software architecture patterns, design decisions, and system design.']),
            Category::factory()->create(['name' => 'Tools', 'slug' => 'tools', 'description' => 'Developer tools, IDEs, extensions, and productivity boosters.']),
            Category::factory()->create(['name' => 'Career', 'slug' => 'career', 'description' => 'Career advice, job hunting, and professional growth for developers.']),
            Category::factory()->create(['name' => 'AI & ML', 'slug' => 'ai-ml', 'description' => 'Artificial intelligence, machine learning, and their applications in web dev.']),
            Category::factory()->create(['name' => 'Mobile', 'slug' => 'mobile', 'description' => 'Mobile app development, responsive design, and PWAs.']),
        ]);

        $tags = collect([
            'laravel', 'angular', 'php', 'typescript', 'docker', 'kubernetes',
            'postgresql', 'redis', 'api', 'rest', 'graphql', 'authentication',
            'tailwind', 'css', 'javascript', 'nodejs', 'python', 'git',
            'ci-cd', 'testing', 'pest', 'phpunit', 'jest', 'cypress',
            'ssr', 'performance', 'seo', 'accessibility', 'responsive', 'pwa',
        ])->map(fn ($name) => Tag::factory()->create(['name' => $name, 'slug' => $name]));

        $allUsers = collect([$admin])->merge($authors);

        $publishedPosts = Post::factory(40)
            ->recycle($allUsers)
            ->create()
            ->each(function (Post $post) use ($categories, $tags, $allUsers, $readers) {
                $post->categories()->attach($categories->random(rand(1, 3))->pluck('id'));
                $post->tags()->attach($tags->random(rand(2, 6))->pluck('id'));

                $commenters = $allUsers->merge($readers);

                Comment::factory(rand(3, 12))
                    ->recycle($post)
                    ->recycle($commenters)
                    ->create()
                    ->each(function (Comment $comment) use ($commenters) {
                        if (fake()->boolean(40)) {
                            Comment::factory(rand(1, 3))
                                ->recycle($comment->post)
                                ->recycle($commenters)
                                ->create(['parent_id' => $comment->id])
                                ->each(function (Comment $reply) use ($commenters) {
                                    if (fake()->boolean(20)) {
                                        Comment::factory(1)
                                            ->recycle($reply->post)
                                            ->recycle($commenters)
                                            ->create(['parent_id' => $reply->id]);
                                    }
                                });
                        }
                    });
            });

        Post::factory(5)->draft()->recycle($allUsers)->create()->each(function (Post $post) use ($categories, $tags) {
            $post->categories()->attach($categories->random(1)->pluck('id'));
            $post->tags()->attach($tags->random(2)->pluck('id'));
        });
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
