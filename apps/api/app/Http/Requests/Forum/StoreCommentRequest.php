<?php

namespace App\Http\Requests\Forum;

use App\Models\Comment;
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
        $topicId = $this->route('topic')?->id ?? $this->route('topicId');

        return [
            'texto' => [
                'required',
                'string',
                'min:1',
                'max:2000',
            ],
            'parentId' => [
                'nullable',
                'uuid',
                Rule::exists('comments', 'id')->where(function ($query) use ($topicId) {
                    $query->where('topic_id', $topicId);
                }),
            ],
            'isAnon' => [
                'boolean',
            ],
            'imageUrl' => [
                'nullable',
                'string',
                'url',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'texto.required' => 'O texto do comentário é obrigatório.',
            'texto.min' => 'O comentário não pode estar vazio.',
            'texto.max' => 'O comentário deve ter no máximo 2000 caracteres.',
            'parentId.exists' => 'O comentário pai não existe ou não pertence a este tópico.',
            'imageUrl.url' => 'A URL da imagem é inválida.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('parentId')) {
            $this->merge([
                'parent_id' => $this->input('parentId'),
            ]);
        }
        if ($this->has('isAnon')) {
            $this->merge([
                'is_anon' => $this->boolean('isAnon'),
            ]);
        }
        if ($this->has('imageUrl')) {
            $this->merge([
                'image_url' => $this->input('imageUrl'),
            ]);
        }
    }
}
