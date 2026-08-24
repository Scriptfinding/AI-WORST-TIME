<?php

namespace App\Services\Sso;

use App\Models\IdentityProvider;

final class SsoProviderService
{
    public function provider(string $type, bool $ready = false): ?IdentityProvider
    {
        $query = IdentityProvider::query()->where('type', $type);
        if ($ready) {
            $query->where('is_enabled', true)->whereNotNull('validated_at');
        }

        return $query->first();
    }

    /** @return array<string, array<string, mixed>|null> */
    public function sanitized(): array
    {
        return [
            IdentityProvider::TYPE_SAML => $this->sanitize($this->provider(IdentityProvider::TYPE_SAML)),
            IdentityProvider::TYPE_LDAP => $this->sanitize($this->provider(IdentityProvider::TYPE_LDAP)),
        ];
    }

    /** @return array<string, mixed>|null */
    private function sanitize(?IdentityProvider $provider): ?array
    {
        if ($provider === null) {
            return null;
        }

        $config = $provider->configArray();
        $provisioningKeys = ['provisioning_mode', 'workspace_ids'];
        $safeKeys = $provider->type === IdentityProvider::TYPE_SAML
            ? [
                'metadata_url', 'idp_entity_id', 'idp_sso_url', 'email_attribute',
                'first_name_attribute', 'last_name_attribute', 'subject_attribute',
                ...$provisioningKeys,
            ]
            : [
                'host', 'port', 'tls_mode', 'base_dn', 'bind_dn', 'login_attribute',
                'user_filter', 'id_attribute', 'email_attribute', 'name_attribute',
                ...$provisioningKeys,
            ];

        return [
            'id' => $provider->id,
            'type' => $provider->type,
            'name' => $provider->name,
            'is_enabled' => $provider->is_enabled,
            'jit_enabled' => $provider->jit_enabled,
            'validated_at' => $provider->validated_at?->toIso8601String(),
            'config' => array_intersect_key($config, array_flip($safeKeys)),
            'idp_certificate_configured' => ! empty($config['idp_certificate']),
            'sp_certificate_configured' => ! empty($config['sp_certificate']),
            'sp_private_key_configured' => ! empty($config['sp_private_key']),
            'bind_password_configured' => ! empty($config['bind_password']),
        ];
    }
}
