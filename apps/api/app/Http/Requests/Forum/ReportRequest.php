<?php

namespace App\Http\Requests\Forum;

use App\Domain\Forum\Enums\ReportMotivo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motivo' => [
                'required',
                'string',
                Rule::in(ReportMotivo::values()),
            ],
            'descricao' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo.required' => 'O motivo da denúncia é obrigatório.',
            'motivo.in' => 'Motivo inválido. Escolha: spam, ofensivo, falso ou outro.',
            'descricao.max' => 'A descrição deve ter no máximo 500 caracteres.',
        ];
    }
}
