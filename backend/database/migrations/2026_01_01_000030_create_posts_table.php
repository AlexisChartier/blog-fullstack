<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('featured_image')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index('author_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
