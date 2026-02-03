<?php

namespace App\Http\Requests\Events;

use App\Domain\Events\Enums\RsvpStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRsvpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'sometimes',
                'required',
                'string',
                Rule::in(RsvpStatus::values()),
            ],
            'guestsCount' => [
                'sometimes',
                'integer',
                'min:1',
                'max:10',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Status inválido. Use: going, maybe ou not_going.',
            'guestsCount.min' => 'O número de convidados deve ser no mínimo 1.',
            'guestsCount.max' => 'O número de convidados deve ser no máximo 10.',
            'notes.max' => 'As observações devem ter no máximo 500 caracteres.',
        ];
    }
}
