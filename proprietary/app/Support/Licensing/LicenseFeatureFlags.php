<?php

namespace App\Support\Licensing;

class LicenseFeatureFlags
{
    public const DEFINITIONS = [
        'snippets_enabled' => 'bool',
        'variables_enabled' => 'bool',
        'run_metadata_search_enabled' => 'bool',
        'mcp_enabled' => 'bool',
        'private_libraries_enabled' => 'bool',
        'vaults_enabled' => 'bool',
        'messenger_enabled' => 'bool',
        'mailbox_enabled' => 'bool',
        'ai_enabled' => 'bool',
        'vcs_enabled' => 'bool',
        'recording_enabled' => 'bool',
        'live_view_enabled' => 'bool',
        'teams_enabled' => 'bool',
        'workspace_sharing_enabled' => 'bool',
        'two_factor_enforcement_enabled' => 'bool',
        'whitelabel_enabled' => 'bool',
        'sso_enabled' => 'bool',
        'github_stargazers' => 'bool',
        'workspace_limit' => 'int',
        'concurrent_runs_limit' => 'int',
        'maximum_retention_limit' => 'int',
        'maximum_timeout_seconds' => 'int',
        'maximum_retries_limit' => 'int',
        'cycle_epoch' => 'string',
        'cycle_freq' => 'int',
        'cycle_runs_limit' => 'int',
        'instance_storage_limit_bytes' => 'int',
        'promote_disabled_features' => 'bool',
        'promote_disabled_features_reason' => 'string',
    ];

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, bool|int|string>
     */
    public static function normalize(array $values): array
    {
        $normalized = [];

        foreach (self::DEFINITIONS as $key => $type) {
            if (! array_key_exists($key, $values) || $values[$key] === null || $values[$key] === '') {
                continue;
            }

            $normalized[$key] = match ($type) {
                'bool' => filter_var($values[$key], FILTER_VALIDATE_BOOL),
                'int' => self::toInt($values[$key]),
                default => self::toString($values[$key]),
            };
        }

        return $normalized;
    }

    private static function toInt(mixed $value): int
    {
        return is_int($value) ? $value : (is_numeric($value) ? (int) $value : 0);
    }

    private static function toString(mixed $value): string
    {
        return is_scalar($value) ? trim((string) $value) : '';
    }
}
