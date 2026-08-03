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
        $title = fake()->sentence(6, true);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'excerpt' => fake()->paragraph(2),
            'content' => fake()->paragraphs(5, true),
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
