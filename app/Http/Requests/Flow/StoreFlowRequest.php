<?php

namespace App\Http\Requests\Flow;

use App\Enums\Authorization\Ability;
use App\Http\Requests\Flow\Concerns\PreservesDefaultInputsEmptyStrings;
use App\Models\Flow;
use App\Rules\ValidNodalGraph;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreFlowRequest extends FormRequest
{
    use PreservesDefaultInputsEmptyStrings;

    public function authorize(): bool
    {
        return Gate::forUser($this->user())->allows(Ability::CREATE->value, Flow::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        /** @var string|null $workspaceId */
        $workspaceId = session('current_workspace_id');

        return [
            'name' => ['required', 'string', 'max:128'],
            'description' => ['nullable', 'string'],
            'visibility' => ['sometimes', 'in:'.implode(',', app(\App\Services\FeatureFlags\FeatureFlagService::class)->allowedScopes())],
            'team_id' => ['nullable', 'string'],
            'owner_id' => ['nullable', 'string', 'exists:users,id'],
            'folder_id' => ['nullable', 'string'],
            'workspace_folder_id' => ['nullable', 'string'],
            'code' => ['nullable', 'string'],
            'source_type' => ['sometimes', 'in:code,repository,library'],
            'flow_type' => ['sometimes', 'in:code,nodal'],
            'nodal_graph' => ['sometimes', 'nullable', 'array', new ValidNodalGraph],
            'default_inputs' => ['sometimes', 'nullable', 'array'],
            'queue_index' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:'.config()->integer('puppetflow.queues_counter', 1)],
            'proxy_mode' => ['sometimes', Rule::in(['none', 'auto', 'specific'])],
            'workspace_proxy_id' => [
                'nullable',
                'integer',
                'required_if:proxy_mode,specific',
                Rule::exists('workspace_proxies', 'id')->where('workspace_id', $workspaceId),
            ],
            'repo_link' => ['required_if:source_type,repository', 'nullable', 'array'],
            'repo_link.integration_id' => [
                'required_with:repo_link',
                'string',
                Rule::exists('integrations', 'id')->where('workspace_id', $workspaceId),
            ],
            'repo_link.repo_full_name' => ['required_with:repo_link', 'string'],
            'repo_link.branch' => ['required_with:repo_link', 'string'],
            'repo_link.file_path' => ['nullable', 'string'],
        ];
    }
}
