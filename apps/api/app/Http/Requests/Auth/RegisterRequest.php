<?php

namespace App\Http\Requests\Auth;

use App\Models\City;
use App\Support\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
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
        return [
            'phone' => [
                'required',
                'string',
                'regex:/^[0-9]{10,11}$/',
                Rule::unique('users', 'phone'),
            ],
            'nome' => [
                'required',
                'string',
                'min:2',
                'max:100',
            ],
            'email' => [
                'nullable',
                'email',
                Rule::unique('users', 'email'),
            ],
            // Simplified: only 8+ characters required
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
            'bairroId' => [
                'nullable',
                'uuid',
                // Removed exists validation - will auto-create if not exists
            ],
            // Address is completely optional
            'address' => [
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
                // City validation is now tenant-aware (no hardcoded Tijucas)
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
            'phone.required' => 'O telefone é obrigatório.',
            'phone.regex' => 'O telefone deve ter 10 ou 11 dígitos.',
            'phone.unique' => 'Este telefone já está cadastrado.',
            'nome.required' => 'O nome é obrigatório.',
            'nome.min' => 'O nome deve ter pelo menos 2 caracteres.',
            'nome.max' => 'O nome deve ter no máximo 100 caracteres.',
            'email.email' => 'O email deve ser um endereço válido.',
            'email.unique' => 'Este email já está cadastrado.',
            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve ter pelo menos 8 caracteres.',
            'password.confirmed' => 'A confirmação de senha não confere.',
            'bairroId.uuid' => 'O bairro selecionado é inválido.',
            'address.cep.regex' => 'O CEP deve ter 8 dígitos.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Resolve city from tenant context or payload
        $city = $this->resolveCityForRegistration();

        if ($this->has('address') && $city) {
            $address = $this->input('address');
            $address['cidade'] = $city->name;
            $address['estado'] = $city->uf;
            $this->merge(['address' => $address]);
        }

        // Convert camelCase to snake_case for bairroId
        if ($this->has('bairroId')) {
            $this->merge([
                'bairro_id' => $this->input('bairroId'),
            ]);
        }

        // Add resolved city_id for controller use
        if ($city) {
            $this->merge(['resolved_city_id' => $city->id]);
        }
    }

    /**
     * Resolve city using hybrid strategy:
     * 1. Tenant context (from URL/header) takes priority
     * 2. Fallback to city_slug from payload if no tenant
     */
    private function resolveCityForRegistration(): ?City
    {
        // Priority 1: Tenant context (server-side, secure)
        if (Tenant::city()) {
            return Tenant::city();
        }

        // Priority 2: city_slug from payload (when no tenant context)
        if ($this->input('city_slug')) {
            return City::whereSlug($this->input('city_slug'))
                ->where('active', true)
                ->first();
        }

        return null;
    }

    /**
     * Get validated data with resolved city.
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);

        // Include resolved city_id for controller
        if ($this->input('resolved_city_id')) {
            $validated['city_id'] = $this->input('resolved_city_id');
        }

        return $validated;
    }
}

