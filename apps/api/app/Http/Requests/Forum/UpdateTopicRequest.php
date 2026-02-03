<?php

namespace App\Http\Requests\Forum;

use App\Domain\Forum\Enums\TopicCategory;
use App\Models\Topic;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        $topic = $this->route('topic');
        return $this->user()->can('update', $topic);
    }

    public function rules(): array
    {
        return [
            'titulo' => [
                'sometimes',
                'string',
                'min:5',
                'max:150',
                'regex:/[a-zA-ZÀ-ÿ]+/',
            ],
            'texto' => [
                'sometimes',
                'string',
                'min:10',
                'max:5000',
            ],
            'categoria' => [
                'sometimes',
                'string',
                Rule::in(TopicCategory::values()),
            ],
            'fotoUrl' => [
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
            'titulo.min' => 'O título deve ter pelo menos 5 caracteres.',
            'titulo.max' => 'O título deve ter no máximo 150 caracteres.',
            'titulo.regex' => 'O título deve conter pelo menos uma letra.',
            'texto.min' => 'O texto deve ter pelo menos 10 caracteres.',
            'texto.max' => 'O texto deve ter no máximo 5000 caracteres.',
            'categoria.in' => 'Categoria inválida.',
            'fotoUrl.url' => 'A URL da foto é inválida.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('fotoUrl')) {
            $this->merge([
                'foto_url' => $this->input('fotoUrl'),
            ]);
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $topic = $this->route('topic');

            // Check 24h edit window (if not admin/moderator)
            if (!$this->user()->hasAnyRole(['admin', 'moderator']) && !$topic->isEditableByAuthor()) {
                $validator->errors()->add('topic', 'O prazo de edição de 24 horas expirou.');
            }
        });
    }
}
