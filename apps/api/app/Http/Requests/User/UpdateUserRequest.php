<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'nome' => [
                'sometimes',
                'string',
                'min:2',
                'max:100',
            ],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'bairroId' => [
                'sometimes',
                'nullable',
                'uuid',
                Rule::exists('bairros', 'id'),
            ],
            'address' => [
                'sometimes',
                'nullable',
                'array',
            ],
            'address.cep' => [
                'nullable',
                'string',
                'regex:/^[0-9]{8}$/',
            ],
            'address.logradouro' => [
                'nullable',
                'string',
                'max:255',
            ],
            'address.numero' => [
                'nullable',
                'string',
                'max:20',
            ],
            'address.complemento' => [
                'nullable',
                'string',
                'max:100',
            ],
            'address.bairro' => [
                'nullable',
                'string',
                'max:100',
            ],
            'address.cidade' => [
                'nullable',
                'string',
                'max:100',
            ],
            'address.estado' => [
                'nullable',
                'string',
                'size:2',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nome.min' => 'O nome deve ter pelo menos 2 caracteres.',
            'nome.max' => 'O nome deve ter no máximo 100 caracteres.',
            'email.email' => 'O email deve ser um endereço válido.',
            'email.unique' => 'Este email já está sendo usado.',
            'bairroId.exists' => 'O bairro selecionado não existe.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('bairroId')) {
            $this->merge([
                'bairro_id' => $this->input('bairroId'),
            ]);
        }
    }
}
