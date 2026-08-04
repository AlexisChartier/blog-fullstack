<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserPostController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/test', fn (Request $request) => response()->json(['status' => 'ok', 'message' => 'API is running']));

// Public routes
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show'])->where('slug', '[a-z0-9-]+');
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/tags', [TagController::class, 'index']);
Route::get('/users/{username}', [UserController::class, 'show'])->where('username', '[a-zA-Z0-9_]+');
Route::get('/users/{username}/posts', [UserPostController::class, 'index'])->where('username', '[a-zA-Z0-9_]+');

// Auth routes
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('web');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('web');
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware(['web', 'auth']);
Route::get('/auth/me', [AuthController::class, 'me'])->middleware(['web', 'auth']);
Route::get('/auth/my-posts', [AuthController::class, 'myPosts'])->middleware(['web', 'auth']);
Route::get('/auth/my-posts/{post}', [AuthController::class, 'myPost'])->middleware(['web', 'auth']);

// Authenticated routes
Route::middleware(['web', 'auth', 'single.session'])->group(function () {
    // Posts CRUD
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Comments
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Comment moderation (admin)
    Route::get('/comments', [CommentController::class, 'index']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);

    // Category CRUD (admin)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Tag CRUD (admin)
    Route::post('/tags', [TagController::class, 'store']);
    Route::put('/tags/{tag}', [TagController::class, 'update']);
    Route::delete('/tags/{tag}', [TagController::class, 'destroy']);

    // Profile
    Route::put('/profile', [ProfileController::class, 'update']);
});
