<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $post = $this->route('post');

        return [
            'content' => ['required', 'string', 'min:2', 'max:1000'],
            'parent_id' => [
                'nullable',
                Rule::exists('comments', 'id')->where(fn ($q) => $q->where('post_id', $post->id)),
            ],
        ];
    }
}
