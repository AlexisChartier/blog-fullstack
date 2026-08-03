<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    public function definition(): array
    {
        $prefixes = ['Getting Started with', 'Mastering', 'Understanding', 'Building', 'A Guide to', 'The Complete', 'Deep Dive into', 'Hands-on', 'Practical', 'Modern'];
        $topics = [
            'Angular Signals', 'Laravel Eloquent', 'Docker Compose', 'Tailwind CSS',
            'PostgreSQL Indexes', 'JWT Authentication', 'Server-Side Rendering',
            'Pest PHP Testing', 'Redis Caching', 'RESTful API Design',
            'TypeScript Generics', 'GitHub Actions CI/CD', 'Progressive Web Apps',
            'Laravel Sanctum', 'Multi-Stage Docker Builds', 'Spatie Permissions',
            'Angular Interceptors', 'Query Optimization', 'Angular Build Tools',
            'Eloquent Relationships', 'Clean TypeScript', 'Kubernetes Basics',
            'CSS Grid Layout', 'Web Security Headers', 'Environment Config',
            'Lazy Loading Routes', 'Database Seeders', 'Node.js Event Loop',
            'Angular Forms', 'Blog Architecture', 'Web Accessibility', 'Git Workflows',
            'Nginx Reverse Proxy', 'Responsive Design Patterns', 'PHP 8.3 Features',
            'Angular Guards', 'Zero-Downtime Deploys', 'Core Web Vitals',
            'Content Projection', 'Monorepo Strategies',
        ];
        $suffixes = ['', ' in 2026', ': A Practical Guide', ' for Beginners', ' Best Practices', ' from Scratch', ' Explained', ': Tips and Tricks'];

        $title = fake()->randomElement($prefixes).' '.fake()->randomElement($topics).fake()->randomElement($suffixes);

        $paragraphCount = rand(4, 8);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'excerpt' => fake()->paragraph(2),
            'content' => fake()->paragraphs($paragraphCount, true),
            'status' => 'published',
            'author_id' => User::factory(),
            'published_at' => fake()->dateTimeBetween('-1 year', 'now'),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
}
