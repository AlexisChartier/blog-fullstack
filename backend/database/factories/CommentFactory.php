<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Comment>
 */
class CommentFactory extends Factory
{
    public function definition(): array
    {
        $contents = [
            'Great article! This really helped me understand the concept better.',
            'Thanks for sharing this, I was struggling with exactly this problem.',
            'I disagree with point 3. In my experience, the opposite approach works better.',
            'Could you elaborate on the performance implications? That part was a bit unclear.',
            'Bookmarked! This is exactly what I needed for my current project.',
            'I have been using this approach for months and it works great. Highly recommend it.',
            'This is a game-changer. I never thought about it this way before.',
            'Excellent tutorial. Clear, concise, and well-structured.',
            'I tried this but got an error. Anyone else having issues with the latest version?',
            'This should be the official documentation. Much clearer than the docs.',
            'I appreciate the real-world examples. They make the concepts much easier to grasp.',
            'I never knew about this feature. This is going to save me so much time!',
            'I shared this with my team. We are adopting this pattern going forward.',
            'I was doing this the hard way for so long. This is so much cleaner.',
            'I love how you break down complex topics into digestible pieces. Keep it up!',
            'Wait, does this work with PostgreSQL? I am getting different results.',
            'This approach has some trade-offs you did not mention. Overall though, great post.',
            'I implemented this last week and it reduced our page load time by 40%.',
            'Can you write a follow-up about testing this? That would be super helpful.',
            'I am a beginner and this was easy to follow. Thank you for not assuming too much knowledge.',
        ];

        return [
            'post_id' => Post::factory(),
            'user_id' => User::factory(),
            'parent_id' => null,
            'content' => fake()->randomElement($contents),
            'is_approved' => true,
        ];
    }

    public function unapproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_approved' => false,
        ]);
    }
}
