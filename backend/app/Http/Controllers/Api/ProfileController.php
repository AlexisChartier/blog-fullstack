<?php

namespace App\Http\Controllers\Api;

use App\Actions\UpdateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request, UpdateProfile $action): JsonResponse
    {
        $user = $action->execute($request->user(), $request->validated(), $request);

        return response()->json([
            'message' => 'Profile updated',
            'user' => $user->load('roles'),
        ]);
    }
}
