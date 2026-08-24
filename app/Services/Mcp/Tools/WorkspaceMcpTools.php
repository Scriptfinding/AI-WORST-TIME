<?php

namespace App\Services\Mcp\Tools;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Enums\Authorization\Ability;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\WorkspaceProvisioner;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** @phpstan-type Arguments array<string, mixed> */
final class WorkspaceMcpTools implements McpToolHandler
{
    public function __construct(
        private readonly FeatureFlagService $features,
        private readonly WorkspaceProvisioner $provisioner,
    ) {}

    public function definitions(): array
    {
        $properties = [
            'name' => ['type' => 'string', 'maxLength' => 255],
            'lookup_key' => ['type' => ['string', 'null'], 'maxLength' => 255],
            'runs_retention_default' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100000],
            'runs_retention_max' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100000],
            'default_flow_timeout_seconds' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 9999999],
            'max_flow_timeout_seconds' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 9999999],
            'max_retries_default' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 255],
            'max_retries_max' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 255],
            'viewport_width' => ['type' => 'integer', 'minimum' => 320, 'maximum' => 3840],
            'viewport_height' => ['type' => 'integer', 'minimum' => 200, 'maximum' => 2160],
            'keyboard_speed' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 10000],
            'icon_type' => ['type' => 'string', 'enum' => ['emoji', 'color']],
            'icon_value' => ['type' => ['string', 'null']],
            'icon_color' => ['type' => ['string', 'null']],
            'allow_trigger_advertising' => ['type' => 'boolean'],
            'require_two_factor' => [
                'type' => 'boolean',
                'description' => 'Require 2FA for all workspace members. Requires the two-factor enforcement entitlement.',
            ],
            'default_flow_code' => ['type' => ['string', 'null']],
        ];

        return [
            ['name' => 'get_current_workspace', 'description' => 'Get the workspace connected to this MCP endpoint.', 'inputSchema' => ['type' => 'object', 'properties' => new \stdClass]],
            ['name' => 'update_current_workspace', 'description' => 'Update settings for the workspace connected to this MCP endpoint.', 'inputSchema' => ['type' => 'object', 'properties' => $properties]],
        ];
    }

    public function handles(string $name): bool
    {
        return in_array($name, array_column($this->definitions(), 'name'), true);
    }

    public function call(string $name, array $arguments, McpToolContext $context): array
    {
        return match ($name) {
            'get_current_workspace' => ['workspace' => $this->serialize($context)],
            'update_current_workspace' => $this->update($arguments, $context),
            default => throw ValidationException::withMessages(['name' => 'Unknown workspace tool.']),
        };
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function update(array $arguments, McpToolContext $context): array
    {
        Gate::forUser($context->user)->authorize(Ability::UPDATE->value, $context->workspace);
        $validated = validator($arguments, [
            'name' => ['sometimes', 'string', 'max:255'],
            'lookup_key' => ['sometimes', 'nullable', 'string', 'max:255', 'regex:/^[a-z][a-z0-9_-]*$/', Rule::unique('workspaces', 'lookup_key')->ignore($context->workspace->id)],
            'runs_retention_default' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'runs_retention_max' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'default_flow_timeout_seconds' => ['sometimes', 'integer', 'min:0', 'max:9999999'],
            'max_flow_timeout_seconds' => ['sometimes', 'integer', 'min:0', 'max:9999999'],
            'max_retries_default' => ['sometimes', 'integer', 'min:0', 'max:255'],
            'max_retries_max' => ['sometimes', 'integer', 'min:0', 'max:255'],
            'viewport_width' => ['sometimes', 'integer', 'min:320', 'max:3840'],
            'viewport_height' => ['sometimes', 'integer', 'min:200', 'max:2160'],
            'keyboard_speed' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'icon_type' => ['sometimes', Rule::in(['emoji', 'color'])],
            'icon_value' => ['nullable', 'string', 'max:100'],
            'icon_color' => ['nullable', 'string', 'max:7'],
            'allow_trigger_advertising' => ['sometimes', 'boolean'],
            'require_two_factor' => ['sometimes', 'boolean'],
            'default_flow_code' => ['sometimes', 'nullable', 'string', 'max:65000'],
        ])->validate();
        $data = WorkspaceMutationData::fromValidated($validated)->normalized(
            $context->workspace,
            $this->features,
            clearIconUploadPathWhenNotUpload: true,
        );
        $this->provisioner->update($context->workspace, $data)->loadCount(['flows', 'users']);

        return ['workspace' => $this->serialize($context)];
    }

    /** @return array<string, mixed> */
    private function serialize(McpToolContext $context): array
    {
        $workspace = $context->workspace->loadMissing('owner:id')->loadCount(['flows', 'users']);

        return [
            'id' => $workspace->id, 'name' => $workspace->name, 'slug' => $workspace->slug,
            'lookup_key' => $workspace->lookup_key, 'owner_id' => $workspace->owner?->id,
            'preferences' => [
                'runs_retention_default' => $workspace->runs_retention_default,
                'runs_retention_max' => $workspace->runs_retention_max,
                'default_flow_timeout_seconds' => $workspace->default_flow_timeout_seconds,
                'max_flow_timeout_seconds' => $workspace->max_flow_timeout_seconds,
                'max_retries_default' => $workspace->max_retries_default,
                'max_retries_max' => $workspace->max_retries_max,
                'viewport_width' => $workspace->viewport_width, 'viewport_height' => $workspace->viewport_height,
                'keyboard_speed' => $workspace->keyboard_speed,
                'allow_trigger_advertising' => (bool) $workspace->allow_trigger_advertising,
                'require_two_factor' => $this->features->enabled('two_factor_enforcement_enabled')
                    && (bool) $workspace->require_two_factor,
                'default_flow_code' => $workspace->default_flow_code,
            ],
            'appearance' => [
                'icon_type' => $workspace->icon_type, 'icon_value' => $workspace->icon_value,
                'icon_color' => $workspace->icon_color, 'icon_url' => $workspace->icon_url,
            ],
            'flows_count' => $workspace->flows_count, 'users_count' => $workspace->users_count,
            'created_at' => $workspace->created_at?->toIso8601String(), 'updated_at' => $workspace->updated_at?->toIso8601String(),
        ];
    }
}
