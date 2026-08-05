<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateUserRoleRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminUserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $users = User::with('roles')
            ->withCount(['posts', 'comments'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return UserResource::collection($users);
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user): JsonResponse
    {
        $user->syncRoles([$request->validated('role')]);

        return response()->json([
            'message' => 'User role updated',
            'user' => UserResource::make($user->fresh()->load('roles')),
        ]);
    }
}
