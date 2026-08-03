<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->when($request->user()?->id === $this->id, $this->email),
            'avatar_url' => $this->avatar_url,
            'bio' => $this->bio,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
