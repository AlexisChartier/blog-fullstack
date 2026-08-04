<?php

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;

describe('Categories API', function () {
    it('lists all categories', function () {
        Category::factory(3)->create();

        $response = $this->getJson('/api/categories')
            ->assertOk();

        expect($response->json('data'))->toHaveCount(3);
    });

    it('includes posts_count', function () {
        $cat = Category::factory()->create();
        $cat->posts()->attach(
            Post::factory(2)->create([
                'status' => 'published',
                'published_at' => now()->subDay(),
            ])
        );

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.posts_count', 2);
    });
});

describe('Category CRUD (admin)', function () {
    it('allows admin to create a category', function () {
        $this->actingAs(adminUser());

        $this->postJson('/api/categories', [
            'name' => 'New Category',
            'description' => 'A test category',
        ])
            ->assertCreated()
            ->assertJsonPath('category.name', 'New Category')
            ->assertJsonPath('category.slug', 'new-category');
    });

    it('prevents non-admin from creating a category', function () {
        $this->actingAs(authorUser());

        $this->withExceptionHandling()->postJson('/api/categories', [
            'name' => 'New Category',
        ])->assertForbidden();
    });

    it('prevents unauthenticated from creating a category', function () {
        $this->withExceptionHandling()->postJson('/api/categories', [
            'name' => 'New Category',
        ])->assertUnauthorized();
    });

    it('validates required name on create', function () {
        $this->actingAs(adminUser());

        $this->withExceptionHandling()->postJson('/api/categories', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates unique slug on create', function () {
        Category::factory()->create(['slug' => 'existing-slug']);
        $this->actingAs(adminUser());

        $this->withExceptionHandling()->postJson('/api/categories', [
            'name' => 'New Cat',
            'slug' => 'existing-slug',
        ])->assertJsonValidationErrors(['slug']);
    });

    it('auto-generates slug from name', function () {
        $this->actingAs(adminUser());

        $this->postJson('/api/categories', [
            'name' => 'Web Development',
        ])->assertCreated()
            ->assertJsonPath('category.slug', 'web-development');
    });

    it('allows admin to update a category', function () {
        $category = Category::factory()->create();
        $this->actingAs(adminUser());

        $this->putJson("/api/categories/{$category->id}", [
            'name' => 'Updated Name',
        ])
            ->assertOk()
            ->assertJsonPath('category.name', 'Updated Name');
    });

    it('prevents non-admin from updating a category', function () {
        $category = Category::factory()->create();
        $this->actingAs(authorUser());

        $this->withExceptionHandling()->putJson("/api/categories/{$category->id}", [
            'name' => 'Updated Name',
        ])->assertForbidden();
    });

    it('allows admin to delete a category', function () {
        $category = Category::factory()->create();
        $this->actingAs(adminUser());

        $this->deleteJson("/api/categories/{$category->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Category deleted');

        expect(Category::find($category->id))->toBeNull();
    });

    it('prevents non-admin from deleting a category', function () {
        $category = Category::factory()->create();
        $this->actingAs(authorUser());

        $this->withExceptionHandling()->deleteJson("/api/categories/{$category->id}")
            ->assertForbidden();
    });
});

describe('Tags API', function () {
    it('lists all tags', function () {
        Tag::factory(3)->create();

        $response = $this->getJson('/api/tags')
            ->assertOk();

        expect($response->json('data'))->toHaveCount(3);
    });

    it('includes posts_count', function () {
        $tag = Tag::factory()->create();
        $tag->posts()->attach(
            Post::factory(3)->create([
                'status' => 'published',
                'published_at' => now()->subDay(),
            ])
        );

        $this->getJson('/api/tags')
            ->assertOk()
            ->assertJsonPath('data.0.posts_count', 3);
    });
});

describe('Tag CRUD (admin)', function () {
    it('allows admin to create a tag', function () {
        $this->actingAs(adminUser());

        $this->postJson('/api/tags', [
            'name' => 'New Tag',
        ])
            ->assertCreated()
            ->assertJsonPath('tag.name', 'New Tag')
            ->assertJsonPath('tag.slug', 'new-tag');
    });

    it('prevents non-admin from creating a tag', function () {
        $this->actingAs(authorUser());

        $this->withExceptionHandling()->postJson('/api/tags', [
            'name' => 'New Tag',
        ])->assertForbidden();
    });

    it('validates required name on create', function () {
        $this->actingAs(adminUser());

        $this->withExceptionHandling()->postJson('/api/tags', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    it('validates unique slug on create', function () {
        Tag::factory()->create(['slug' => 'existing-slug']);
        $this->actingAs(adminUser());

        $this->withExceptionHandling()->postJson('/api/tags', [
            'name' => 'New Tag',
            'slug' => 'existing-slug',
        ])->assertJsonValidationErrors(['slug']);
    });

    it('auto-generates slug from name', function () {
        $this->actingAs(adminUser());

        $this->postJson('/api/tags', [
            'name' => 'TypeScript',
        ])->assertCreated()
            ->assertJsonPath('tag.slug', 'typescript');
    });

    it('allows admin to update a tag', function () {
        $tag = Tag::factory()->create();
        $this->actingAs(adminUser());

        $this->putJson("/api/tags/{$tag->id}", [
            'name' => 'Updated Tag',
        ])
            ->assertOk()
            ->assertJsonPath('tag.name', 'Updated Tag');
    });

    it('prevents non-admin from updating a tag', function () {
        $tag = Tag::factory()->create();
        $this->actingAs(authorUser());

        $this->withExceptionHandling()->putJson("/api/tags/{$tag->id}", [
            'name' => 'Updated Tag',
        ])->assertForbidden();
    });

    it('allows admin to delete a tag', function () {
        $tag = Tag::factory()->create();
        $this->actingAs(adminUser());

        $this->deleteJson("/api/tags/{$tag->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Tag deleted');

        expect(Tag::find($tag->id))->toBeNull();
    });

    it('prevents non-admin from deleting a tag', function () {
        $tag = Tag::factory()->create();
        $this->actingAs(authorUser());

        $this->withExceptionHandling()->deleteJson("/api/tags/{$tag->id}")
            ->assertForbidden();
    });
});
