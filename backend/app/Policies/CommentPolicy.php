<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Comment $comment): bool
    {
        return $user->isAdmin() || $comment->user_id === $user->id;
    }

    public function update(User $user): bool
    {
        return $user->isAdmin();
    }
}
