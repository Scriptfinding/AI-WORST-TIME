<?php

namespace App\Http\Requests\DataTable;

use App\Enums\Authorization\Ability;
use App\Models\DataTable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreDataTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::forUser($this->user())->allows(Ability::CREATE->value, DataTable::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $workspaceId = session('current_workspace_id');

        return [
            'name' => [
                'required', 'string', 'max:128',
                Rule::unique('data_tables', 'name')
                    ->where('workspace_id', is_string($workspaceId) ? $workspaceId : ''),
            ],
            'description' => ['nullable', 'string'],
            'visibility' => [
                'sometimes',
                Rule::in(app(\App\Services\FeatureFlags\FeatureFlagService::class)->allowedScopes()),
            ],
            'team_id' => ['nullable', 'string'],
            'user_id' => ['nullable', 'string', 'exists:users,id'],
        ];
    }
}
