<?php

namespace App\Http\Requests\Flow;

use App\Enums\Authorization\Ability;
use App\Http\Requests\Flow\Concerns\PreservesDefaultInputsEmptyStrings;
use App\Models\Flow;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateFlowRequest extends FormRequest
{
    use PreservesDefaultInputsEmptyStrings;

    public function authorize(): bool
    {
        $flow = $this->route('flow');
        $currentWorkspaceId = session('current_workspace_id');

        return $flow instanceof Flow
            && is_string($currentWorkspaceId) && $currentWorkspaceId !== ''
            && $flow->workspace_id === $currentWorkspaceId
            && Gate::forUser($this->user())->allows(Ability::UPDATE->value, $flow);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $flow = $this->route('flow');
        $workspaceId = $flow instanceof Flow ? $flow->workspace_id : null;

        return [
            'name' => ['sometimes', 'string', 'max:128'],
            'description' => ['nullable', 'string'],
            'readme' => ['sometimes', 'nullable', 'string'],
            'flow_type' => ['sometimes', 'in:code,nodal'],
            'folder_id' => ['nullable', 'string'],
            'workspace_folder_id' => ['nullable', 'string'],
            'available_in_mcp' => ['sometimes', 'boolean'],
            'queue_index' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:'.config()->integer('puppetflow.queues_counter', 1)],
            'proxy_mode' => ['sometimes', Rule::in(['none', 'auto', 'specific'])],
            'workspace_proxy_id' => [
                'nullable',
                'integer',
                'required_if:proxy_mode,specific',
                Rule::exists('workspace_proxies', 'id')->where('workspace_id', $workspaceId),
            ],
            'visibility' => ['sometimes', 'in:'.implode(',', app(\App\Services\FeatureFlags\FeatureFlagService::class)->allowedScopes())],
            'timeout_seconds' => ['sometimes', 'integer', 'min:0', 'max:9999999'],
            'operator_seconds' => ['sometimes', 'integer', 'min:0', 'max:9999999'],
            'max_retries' => ['sometimes', 'integer', 'min:0', 'max:255'],
            'include_raw_output' => ['sometimes', 'boolean'],
            'include_input_in_output' => ['sometimes', 'boolean'],
            'include_context_in_output' => ['sometimes', 'boolean'],
            'always_success_response' => ['sometimes', 'boolean'],
            'export_artifacts_screenshots' => ['sometimes', 'boolean'],
            'export_artifacts_downloads' => ['sometimes', 'boolean'],
            'export_artifacts_recording' => ['sometimes', 'boolean'],
            'runs_retention_limit' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000'],
            'viewport_width' => ['sometimes', 'nullable', 'integer', 'min:320', 'max:3840'],
            'viewport_height' => ['sometimes', 'nullable', 'integer', 'min:200', 'max:2160'],
            'keyboard_speed' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:10000'],
            'disable_web_security' => ['sometimes', 'boolean'],
            'default_inputs' => ['sometimes', 'nullable', 'array'],
            'icon_type' => ['sometimes', 'in:emoji,color,upload'],
            'icon_value' => ['nullable', 'string', 'max:100'],
            'icon_color' => ['nullable', 'string', 'max:7'],
            'cover_color' => ['nullable', 'string', 'max:7'],
            'owner_id' => ['sometimes', 'nullable', 'string', 'exists:users,id'],
        ];
    }
}
