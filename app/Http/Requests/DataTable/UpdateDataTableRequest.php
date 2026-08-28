<?php

namespace App\Http\Requests\DataTable;

use App\Enums\Authorization\Ability;
use App\Models\DataTable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateDataTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        $dataTable = $this->route('dataTable');

        return $dataTable instanceof DataTable
            && $dataTable->workspace_id === session('current_workspace_id')
            && Gate::forUser($this->user())->allows(Ability::UPDATE->value, $dataTable);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $dataTable = $this->route('dataTable');

        return [
            'name' => [
                'sometimes', 'string', 'max:128',
                Rule::unique('data_tables', 'name')
                    ->where('workspace_id', $dataTable instanceof DataTable ? $dataTable->workspace_id : '')
                    ->ignore($dataTable instanceof DataTable ? $dataTable->id : null),
            ],
            'description' => ['nullable', 'string'],
            'visibility' => [
                'sometimes',
                Rule::in(app(\App\Services\FeatureFlags\FeatureFlagService::class)->allowedScopes()),
            ],
            'team_id' => ['nullable', 'string'],
            'user_id' => ['sometimes', 'nullable', 'string', 'exists:users,id'],
        ];
    }
}
