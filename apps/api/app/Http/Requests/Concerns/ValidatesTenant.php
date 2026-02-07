<?php

namespace App\Http\Requests\Concerns;

use App\Support\Tenant;
use Illuminate\Validation\Validator;

/**
 * ValidatesTenant Trait
 * 
 * Adds automatic tenant validation to Form Requests.
 * Ensures foreign key references (like bairro_id) belong to the current tenant.
 * 
 * Usage:
 * ```php
 * class CreateTopicRequest extends FormRequest
 * {
 *     use ValidatesTenant;
 *     
 *     public function rules(): array
 *     {
 *         return [
 *             'title' => 'required|string|max:255',
 *             'bairro_id' => 'nullable|uuid',
 *         ];
 *     }
 * }
 * ```
 */
trait ValidatesTenant
{
    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validateTenantConstraints($validator);
        });
    }

    /**
     * Validate that references belong to the current tenant.
     */
    protected function validateTenantConstraints(Validator $validator): void
    {
        if (!Tenant::isSet()) {
            return;
        }

        $cityId = Tenant::cityId();

        // Validate bairro_id belongs to current city
        if ($this->has('bairro_id') && $this->bairro_id) {
            $bairro = \App\Models\Bairro::find($this->bairro_id);

            if (!$bairro) {
                $validator->errors()->add('bairro_id', 'Bairro não encontrado.');
            } elseif ($bairro->city_id !== $cityId) {
                $validator->errors()->add('bairro_id', 'Este bairro não pertence à sua cidade.');
            }
        }

        // Validate city_id if provided (must match current tenant)
        if ($this->has('city_id') && $this->city_id) {
            if ($this->city_id !== $cityId) {
                $validator->errors()->add('city_id', 'Você não pode criar registros para outra cidade.');
            }
        }

        // Call custom validation if defined in the request
        if (method_exists($this, 'validateCustomTenantConstraints')) {
            $this->validateCustomTenantConstraints($validator, $cityId);
        }
    }

    /**
     * Add city_id to validated data if not present.
     */
    public function validatedWithTenant(): array
    {
        $validated = $this->validated();

        if (Tenant::isSet() && !isset($validated['city_id'])) {
            $validated['city_id'] = Tenant::cityId();
        }

        return $validated;
    }
}
