<?php

namespace App\Domains\Reports\Http\Requests;

use App\Domains\Reports\Enums\ReportStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateReportStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'moderator']);
    }

    protected function prepareForValidation(): void
    {
        if (!$this->filled('version') && $this->header('If-Unmodified-Since')) {
            $this->merge([
                'version' => $this->header('If-Unmodified-Since'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(ReportStatus::class)],
            'note' => 'nullable|string|max:500',
            'version' => 'required|date',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Informe o novo status.',
            'status.enum' => 'Status invalido.',
            'note.max' => 'A observacao nao pode ter mais de 500 caracteres.',
            'version.required' => 'Informe a versao atual do registro.',
            'version.date' => 'A versao informada e invalida.',
        ];
    }
}