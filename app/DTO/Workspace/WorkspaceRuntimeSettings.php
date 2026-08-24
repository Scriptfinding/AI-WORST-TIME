<?php

namespace App\DTO\Workspace;

use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use InvalidArgumentException;

final readonly class WorkspaceRuntimeSettings
{
    /**
     * @param  array<mixed>|null  $defaultFlowNodalGraph
     * @param  list<string>  $present
     */
    private function __construct(
        public ?int $runsRetentionDefault,
        public ?int $runsRetentionMax,
        public ?int $defaultFlowTimeoutSeconds,
        public ?int $maxFlowTimeoutSeconds,
        public ?int $maxRetriesDefault,
        public ?int $maxRetriesMax,
        public ?int $viewportWidth,
        public ?int $viewportHeight,
        public ?int $keyboardSpeed,
        public ?int $debugLogObjectDepth,
        public ?int $debugLogArrayLimit,
        public ?bool $allowTriggerAdvertising,
        public ?bool $requireTwoFactor,
        public ?string $defaultFlowType,
        public ?string $defaultFlowCode,
        public ?array $defaultFlowNodalGraph,
        private array $present,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        return new self(
            runsRetentionDefault: self::optionalInt($validated, 'runs_retention_default'),
            runsRetentionMax: self::optionalInt($validated, 'runs_retention_max'),
            defaultFlowTimeoutSeconds: self::optionalInt($validated, 'default_flow_timeout_seconds'),
            maxFlowTimeoutSeconds: self::optionalInt($validated, 'max_flow_timeout_seconds'),
            maxRetriesDefault: self::optionalInt($validated, 'max_retries_default'),
            maxRetriesMax: self::optionalInt($validated, 'max_retries_max'),
            viewportWidth: self::optionalInt($validated, 'viewport_width'),
            viewportHeight: self::optionalInt($validated, 'viewport_height'),
            keyboardSpeed: self::optionalInt($validated, 'keyboard_speed'),
            debugLogObjectDepth: self::optionalInt($validated, 'debug_log_object_depth'),
            debugLogArrayLimit: self::optionalInt($validated, 'debug_log_array_limit'),
            allowTriggerAdvertising: self::optionalBool($validated, 'allow_trigger_advertising'),
            requireTwoFactor: self::optionalBool($validated, 'require_two_factor'),
            defaultFlowType: self::optionalNullableString($validated, 'default_flow_type'),
            defaultFlowCode: self::optionalNullableString($validated, 'default_flow_code'),
            defaultFlowNodalGraph: self::optionalNullableArray($validated, 'default_flow_nodal_graph'),
            present: array_values(array_intersect(
                array_keys($validated),
                self::fields(),
            )),
        );
    }

    public function normalized(Workspace $workspace, FeatureFlagService $features): self
    {
        $data = $this->toArray();

        $globalRetentionMax = $features->maximumRetentionLimit();
        if (isset($data['runs_retention_max']) && $globalRetentionMax > 0) {
            $data['runs_retention_max'] = $data['runs_retention_max'] > 0
                ? min($data['runs_retention_max'], $globalRetentionMax)
                : $globalRetentionMax;
        }

        $retentionMax = self::positiveMinimum(
            $globalRetentionMax,
            max(0, self::integerValue($data['runs_retention_max'] ?? $workspace->runs_retention_max ?? 0)),
        );
        if (isset($data['runs_retention_default']) && $retentionMax > 0) {
            $data['runs_retention_default'] = $data['runs_retention_default'] > 0
                ? min($data['runs_retention_default'], $retentionMax)
                : $retentionMax;
        }

        $globalMax = $features->maximumTimeoutSeconds();
        if (isset($data['max_flow_timeout_seconds']) && $data['max_flow_timeout_seconds'] > 0) {
            if ($globalMax > 0) {
                $data['max_flow_timeout_seconds'] = min($data['max_flow_timeout_seconds'], $globalMax);
            }
        } elseif (isset($data['max_flow_timeout_seconds']) && $globalMax > 0) {
            $data['max_flow_timeout_seconds'] = $globalMax;
        }

        if (isset($data['default_flow_timeout_seconds'])) {
            $workspaceMax = max(
                0,
                self::integerValue($data['max_flow_timeout_seconds'] ?? $workspace->max_flow_timeout_seconds ?? 0),
            );
            $effectiveMax = self::positiveMinimum($globalMax, $workspaceMax);

            if ($effectiveMax > 0) {
                $data['default_flow_timeout_seconds'] = $data['default_flow_timeout_seconds'] > 0
                    ? min($data['default_flow_timeout_seconds'], $effectiveMax)
                    : $effectiveMax;
            }
        }

        $globalMaxRetries = $features->maximumRetriesLimit();
        if (isset($data['max_retries_max']) && $globalMaxRetries > 0) {
            $data['max_retries_max'] = $data['max_retries_max'] > 0
                ? min($data['max_retries_max'], $globalMaxRetries)
                : $globalMaxRetries;
        }

        $workspaceMaxRetries = max(
            0,
            self::integerValue($data['max_retries_max'] ?? $workspace->max_retries_max ?? 0),
        );
        $maxRetriesMax = $workspaceMaxRetries > 0
            ? min($workspaceMaxRetries, $globalMaxRetries)
            : $globalMaxRetries;
        if (isset($data['max_retries_default']) && $maxRetriesMax > 0) {
            $data['max_retries_default'] = $data['max_retries_default'] > 0
                ? min($data['max_retries_default'], $maxRetriesMax)
                : $maxRetriesMax;
        }

        if (($data['require_two_factor'] ?? false) === true) {
            $features->abortIfDisabled('two_factor_enforcement_enabled');
        }

        return self::fromValidated($data);
    }

    /**
     * @return array{
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
            'runs_retention_default' => $this->runsRetentionDefault,
            'runs_retention_max' => $this->runsRetentionMax,
            'default_flow_timeout_seconds' => $this->defaultFlowTimeoutSeconds,
            'max_flow_timeout_seconds' => $this->maxFlowTimeoutSeconds,
            'max_retries_default' => $this->maxRetriesDefault,
            'max_retries_max' => $this->maxRetriesMax,
            'viewport_width' => $this->viewportWidth,
            'viewport_height' => $this->viewportHeight,
            'keyboard_speed' => $this->keyboardSpeed,
            'debug_log_object_depth' => $this->debugLogObjectDepth,
            'debug_log_array_limit' => $this->debugLogArrayLimit,
            'allow_trigger_advertising' => $this->allowTriggerAdvertising,
            'require_two_factor' => $this->requireTwoFactor,
            'default_flow_type' => $this->defaultFlowType,
            'default_flow_code' => $this->defaultFlowCode,
            'default_flow_nodal_graph' => $this->defaultFlowNodalGraph,
        ];

        return array_intersect_key($values, array_flip($this->present));
    }

    /**
     * @return list<string>
     */
    private static function fields(): array
    {
        return [
            'runs_retention_default',
            'runs_retention_max',
            'default_flow_timeout_seconds',
            'max_flow_timeout_seconds',
            'max_retries_default',
            'max_retries_max',
            'viewport_width',
            'viewport_height',
            'keyboard_speed',
            'debug_log_object_depth',
            'debug_log_array_limit',
            'allow_trigger_advertising',
            'require_two_factor',
            'default_flow_type',
            'default_flow_code',
            'default_flow_nodal_graph',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function optionalInt(array $data, string $key): ?int
    {
        if (! array_key_exists($key, $data)) {
            return null;
        }

        if (! is_int($data[$key]) && ! (is_string($data[$key]) && preg_match('/^-?\d+$/', $data[$key]) === 1)) {
            throw new InvalidArgumentException("{$key} must be an integer.");
        }

        return (int) $data[$key];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function optionalBool(array $data, string $key): ?bool
    {
        if (! array_key_exists($key, $data)) {
            return null;
        }

        if (! in_array($data[$key], [true, false, 0, 1, '0', '1'], true)) {
            throw new InvalidArgumentException("{$key} must be a boolean.");
        }

        return in_array($data[$key], [true, 1, '1'], true);
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

    /**
     * @param  array<string, mixed>  $data
     * @return array<mixed>|null
     */
    private static function optionalNullableArray(array $data, string $key): ?array
    {
        if (! array_key_exists($key, $data) || $data[$key] === null) {
            return null;
        }

        if (! is_array($data[$key])) {
            throw new InvalidArgumentException("{$key} must be an array or null.");
        }

        return $data[$key];
    }

    private static function positiveMinimum(int ...$limits): int
    {
        $positiveLimits = array_filter($limits, fn (int $limit): bool => $limit > 0);

        return $positiveLimits === [] ? 0 : min($positiveLimits);
    }

    private static function integerValue(mixed $value): int
    {
        return is_int($value) || is_string($value) ? (int) $value : 0;
    }
}
