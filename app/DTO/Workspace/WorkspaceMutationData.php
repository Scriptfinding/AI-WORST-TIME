<?php

namespace App\DTO\Workspace;

use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use InvalidArgumentException;

final readonly class WorkspaceMutationData
{
    /**
     * @param  list<string>  $present
     */
    private function __construct(
        public ?string $name,
        public ?string $slug,
        public ?string $lookupKey,
        public ?string $expiresAt,
        public ?string $iconType,
        public ?string $iconValue,
        public ?string $iconColor,
        public ?string $iconUploadPath,
        public WorkspaceRuntimeSettings $runtimeSettings,
        private array $present,
    ) {}

    public static function named(string $name, ?string $slug = null): self
    {
        $data = ['name' => $name];
        if ($slug !== null) {
            $data['slug'] = $slug;
        }

        return self::fromValidated($data);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        return new self(
            name: self::optionalString($validated, 'name'),
            slug: self::optionalString($validated, 'slug'),
            lookupKey: self::optionalNullableString($validated, 'lookup_key'),
            expiresAt: self::optionalNullableString($validated, 'expires_at'),
            iconType: self::optionalString($validated, 'icon_type'),
            iconValue: self::optionalNullableString($validated, 'icon_value'),
            iconColor: self::optionalNullableString($validated, 'icon_color'),
            iconUploadPath: self::optionalNullableString($validated, 'icon_upload_path'),
            runtimeSettings: WorkspaceRuntimeSettings::fromValidated($validated),
            present: array_values(array_intersect(
                array_keys($validated),
                self::fields(),
            )),
        );
    }

    public function normalized(
        Workspace $workspace,
        FeatureFlagService $features,
        bool $clearIconUploadPathWhenNotUpload = false,
    ): self {
        $data = $this->toArray();
        $data = [
            ...$data,
            ...$this->runtimeSettings->normalized($workspace, $features)->toArray(),
        ];

        if ($clearIconUploadPathWhenNotUpload && ($data['icon_type'] ?? null) !== 'upload') {
            $data['icon_upload_path'] = null;
        }

        return self::fromValidated($data);
    }

    public function hasName(): bool
    {
        return in_array('name', $this->present, true);
    }

    /**
     * @return array{
     *   name?: string|null,
     *   slug?: string|null,
     *   lookup_key?: string|null,
     *   expires_at?: string|null,
     *   icon_type?: string|null,
     *   icon_value?: string|null,
     *   icon_color?: string|null,
     *   icon_upload_path?: string|null,
     *   runs_retention_default?: int|null,
     *   runs_retention_max?: int|null,
     *   default_flow_timeout_seconds?: int|null,
     *   max_flow_timeout_seconds?: int|null,
     *   max_retries_default?: int|null,
     *   max_retries_max?: int|null,
     *   viewport_width?: int|null,
     *   viewport_height?: int|null,
     *   keyboard_speed?: int|null,
     *   debug_log_object_depth?: int|null,
     *   debug_log_array_limit?: int|null,
     *   allow_trigger_advertising?: bool|null,
     *   require_two_factor?: bool|null,
     *   default_flow_type?: string|null,
     *   default_flow_code?: string|null,
     *   default_flow_nodal_graph?: array<mixed>|null
     * }
     */
    public function toArray(): array
    {
        $values = [
            'name' => $this->name,
            'slug' => $this->slug,
            'lookup_key' => $this->lookupKey,
            'expires_at' => $this->expiresAt,
            'icon_type' => $this->iconType,
            'icon_value' => $this->iconValue,
            'icon_color' => $this->iconColor,
            'icon_upload_path' => $this->iconUploadPath,
        ];

        return [
            ...array_intersect_key($values, array_flip($this->present)),
            ...$this->runtimeSettings->toArray(),
        ];
    }

    /**
     * @return list<string>
     */
    private static function fields(): array
    {
        return [
            'name',
            'slug',
            'lookup_key',
            'expires_at',
            'icon_type',
            'icon_value',
            'icon_color',
            'icon_upload_path',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function optionalString(array $data, string $key): ?string
    {
        if (! array_key_exists($key, $data)) {
            return null;
        }

        if (! is_string($data[$key])) {
            throw new InvalidArgumentException("{$key} must be a string.");
        }

        return $data[$key];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function optionalNullableString(array $data, string $key): ?string
    {
        if (! array_key_exists($key, $data) || $data[$key] === null) {
            return null;
        }

        if (! is_string($data[$key])) {
            throw new InvalidArgumentException("{$key} must be a string or null.");
        }

        return $data[$key];
    }
}
