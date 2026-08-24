<?php

namespace App\Http\Requests\Workspace;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Enums\Authorization\Ability;
use App\Models\Workspace;
use App\Rules\ValidNodalGraph;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWorkspaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $workspace = Workspace::find(session('current_workspace_id'));

        return $workspace !== null
            && ($this->user()?->can(Ability::UPDATE->value, $workspace) ?? false);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'lookup_key' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z][a-z0-9_-]*$/',
                Rule::unique('workspaces', 'lookup_key')->ignore(session('current_workspace_id')),
            ],
            'runs_retention_default' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'runs_retention_max' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'default_flow_timeout_seconds' => ['sometimes', 'integer', 'min:0', 'max:9999999'],
            'max_flow_timeout_seconds' => ['sometimes', 'integer', 'min:0', 'max:9999999'],
            'max_retries_default' => ['sometimes', 'integer', 'min:0', 'max:255'],
            'max_retries_max' => ['sometimes', 'integer', 'min:0', 'max:255'],
            'viewport_width' => ['sometimes', 'integer', 'min:320', 'max:3840'],
            'viewport_height' => ['sometimes', 'integer', 'min:200', 'max:2160'],
            'keyboard_speed' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'debug_log_object_depth' => ['sometimes', 'integer', 'between:0,20'],
            'debug_log_array_limit' => ['sometimes', 'integer', 'between:1,1000'],
            'icon_type' => ['sometimes', 'in:emoji,color,upload'],
            'icon_value' => ['nullable', 'string', 'max:100'],
            'icon_color' => ['nullable', 'string', 'max:7'],
            'allow_trigger_advertising' => ['sometimes', 'boolean'],
            'require_two_factor' => ['sometimes', 'boolean'],
            'default_flow_type' => ['sometimes', 'in:code,nodal'],
            'default_flow_code' => ['sometimes', 'nullable', 'string', 'max:65000'],
            'default_flow_nodal_graph' => ['sometimes', 'nullable', 'array', new ValidNodalGraph],
        ];
    }

    public function mutationData(): WorkspaceMutationData
    {
        return WorkspaceMutationData::fromValidated($this->validated());
    }
}
