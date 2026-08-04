<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function (Request $request) {
    if ($request->wantsJson()) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    abort(401);
})->name('login');
