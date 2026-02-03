<?php

namespace App\Http\Requests\Forum;

use App\Domain\Forum\Enums\TopicCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titulo' => [
                'required',
                'string',
                'min:5',
                'max:150',
                'regex:/[a-zA-ZÀ-ÿ]+/', // Must contain at least one letter (not just emojis)
            ],
            'texto' => [
                'required',
                'string',
                'min:10',
                'max:5000',
            ],
            'categoria' => [
                'required',
                'string',
                Rule::in(TopicCategory::values()),
            ],
            'bairroId' => [
                'required',
                'uuid',
                Rule::exists('bairros', 'id'),
            ],
            'isAnon' => [
                'boolean',
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
            'titulo.required' => 'O título é obrigatório.',
            'titulo.min' => 'O título deve ter pelo menos 5 caracteres.',
            'titulo.max' => 'O título deve ter no máximo 150 caracteres.',
            'titulo.regex' => 'O título deve conter pelo menos uma letra.',
            'texto.required' => 'O texto é obrigatório.',
            'texto.min' => 'O texto deve ter pelo menos 10 caracteres.',
            'texto.max' => 'O texto deve ter no máximo 5000 caracteres.',
            'categoria.required' => 'A categoria é obrigatória.',
            'categoria.in' => 'Categoria inválida.',
            'bairroId.required' => 'O bairro é obrigatório.',
            'bairroId.exists' => 'O bairro selecionado não existe.',
            'fotoUrl.url' => 'A URL da foto é inválida.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Convert camelCase to snake_case
        if ($this->has('bairroId')) {
            $this->merge([
                'bairro_id' => $this->input('bairroId'),
            ]);
        }
        if ($this->has('isAnon')) {
            $this->merge([
                'is_anon' => $this->boolean('isAnon'),
            ]);
        }
        if ($this->has('fotoUrl')) {
            $this->merge([
                'foto_url' => $this->input('fotoUrl'),
            ]);
        }
    }
}
