<?php

namespace App\Http\Controllers\Api;

use App\Actions\LoginUser;
use App\Actions\LogoutUser;
use App\Actions\RegisterUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RegisterRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterUser $action): JsonResponse
    {
        $user = $action->execute($request->validated(), $request);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user->load('roles'),
        ], 201);
    }

    public function login(LoginRequest $request, LoginUser $action): JsonResponse
    {
        $user = $action->execute($request->only('email', 'password'), $request);

        if ($user === null) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load('roles'),
        ]);
    }

    public function logout(Request $request, LogoutUser $action): JsonResponse
    {
        $action->execute($request);

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('roles'),
        ]);
    }
}
