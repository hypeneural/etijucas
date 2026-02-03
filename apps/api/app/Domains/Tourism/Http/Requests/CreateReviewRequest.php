<?php

namespace App\Domains\Tourism\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'titulo' => ['nullable', 'string', 'max:200'],
            'texto' => ['required', 'string', 'min:10', 'max:2000'],
            'fotos' => ['nullable', 'array', 'max:5'],
            'fotos.*' => ['url'],
            'visitDate' => ['nullable', 'date', 'before_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'rating.required' => 'A nota é obrigatória',
            'rating.min' => 'A nota mínima é 1',
            'rating.max' => 'A nota máxima é 5',
            'texto.required' => 'O comentário é obrigatório',
            'texto.min' => 'O comentário deve ter pelo menos 10 caracteres',
        ];
    }
}
