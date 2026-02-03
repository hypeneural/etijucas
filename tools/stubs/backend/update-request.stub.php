<?php

namespace App\Http\Requests\{{Feature}};

use Illuminate\Foundation\Http\FormRequest;
{{ruleUse}}

class Update{{Model}}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
{{rules}}
        ];
    }

    protected function prepareForValidation(): void
    {
{{prepare}}
    }
}
