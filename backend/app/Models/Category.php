<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description'];

    protected static function booted(): void
    {
        static::creating(function (Category $category) {
            $category->slug = $category->slug ?? Str::slug($category->name);
        });
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class);
    }
}
