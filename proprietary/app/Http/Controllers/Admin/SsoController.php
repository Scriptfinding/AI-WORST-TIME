<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IdentityProvider;
use App\Models\RegistrationRequest;
use App\Models\SsoRegistrationRequest;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Sso\LdapService;
use App\Services\Sso\SamlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use OneLogin\Saml2\Settings;

class SsoController extends Controller
{
    public function __construct(private readonly FeatureFlagService $features) {}

    public function update(Request $request, string $type, SamlService $saml): RedirectResponse
    {
        $this->guard($type);
        $provider = IdentityProvider::query()->firstOrNew(['type' => $type]);
        $validated = $this->validateProvider($request, $type);
        $config = $this->mergeConfig($provider, $validated['config']);
        if ($type === IdentityProvider::TYPE_SAML) {
            $config = $saml->importMetadata($config);
        }

        $changed = $provider->exists && $provider->config !== $config;
        $provider->fill([
            'name' => $validated['name'],
            'config' => $config,
            'jit_enabled' => $validated['jit_enabled'],
            'is_enabled' => $changed ? false : (bool) $provider->is_enabled,
            'validated_at' => $changed ? null : $provider->validated_at,
        ])->save();

        return back()->with('success', 'SSO provider saved. Test it before enabling.');
    }

    public function test(Request $request, string $type, SamlService $saml, LdapService $ldap): RedirectResponse
    {
        $this->update($request, $type, $saml);
        $provider = IdentityProvider::query()->where('type', $type)->firstOrFail();

        try {
            if ($type === IdentityProvider::TYPE_SAML) {
                new Settings($this->samlSettingsForValidation($provider));
            } else {
                $ldap->test($provider);
            }
        } catch (\Throwable $exception) {
            report($exception);
            throw ValidationException::withMessages([
                'provider' => strtoupper($type).' validation failed. Check the provider configuration.',
            ]);
        }

        $provider->forceFill(['validated_at' => now()])->save();

        return back()->with('success', strtoupper($type).' configuration validated.');
    }

    public function toggle(Request $request, string $type): RedirectResponse
    {
        $this->guard($type);
        $validated = $request->validate(['is_enabled' => ['required', 'boolean']]);
        $provider = IdentityProvider::query()->where('type', $type)->firstOrFail();
        if ($validated['is_enabled'] && $provider->validated_at === null) {
            throw ValidationException::withMessages(['is_enabled' => 'Test the provider before enabling it.']);
        }
        $provider->update(['is_enabled' => $validated['is_enabled']]);

        return back()->with('success', strtoupper($type).' provider updated.');
    }

    public function destroy(string $type): RedirectResponse
    {
        $this->guard($type);
        DB::transaction(function () use ($type): void {
            $provider = IdentityProvider::query()
                ->where('type', $type)
                ->lockForUpdate()
                ->first();
            if ($provider === null) {
                return;
            }

            $registrationIds = SsoRegistrationRequest::query()
                ->where('identity_provider_id', $provider->id)
                ->pluck('registration_request_id');
            RegistrationRequest::query()->whereIn('id', $registrationIds)->delete();
            $provider->delete();
        }, 3);

        return back()->with('success', strtoupper($type).' provider removed.');
    }

    /** @return array{name: string, jit_enabled: bool, config: array<string, mixed>} */
    private function validateProvider(Request $request, string $type): array
    {
        $common = [
            'name' => ['required', 'string', 'max:255'],
            'jit_enabled' => ['required', 'boolean'],
        ];
        $provisioning = [
            'config.provisioning_mode' => ['required', Rule::in(['auto_join', 'approval'])],
            'config.workspace_ids' => [
                Rule::requiredIf(fn (): bool => $request->boolean('jit_enabled')
                    && $request->input('config.provisioning_mode') === 'auto_join'),
                'array',
            ],
            'config.workspace_ids.*' => ['string', 'distinct', 'exists:workspaces,id'],
        ];

        $config = $type === IdentityProvider::TYPE_SAML
            ? $request->validate([
                ...$common,
                ...$provisioning,
                'config.metadata_url' => ['nullable', 'url:https', 'max:2048'],
                'config.metadata_xml' => ['nullable', 'string', 'max:2000000'],
                'config.idp_entity_id' => ['nullable', 'string', 'max:2048'],
                'config.idp_sso_url' => ['nullable', 'url:https', 'max:2048'],
                'config.idp_certificate' => ['nullable', 'string', 'max:20000'],
                'config.sp_certificate' => ['nullable', 'string', 'max:20000'],
                'config.sp_private_key' => ['nullable', 'string', 'max:20000'],
                'config.email_attribute' => ['required', 'string', 'max:255'],
                'config.first_name_attribute' => ['nullable', 'string', 'max:255'],
                'config.last_name_attribute' => ['nullable', 'string', 'max:255'],
                'config.subject_attribute' => ['nullable', 'string', 'max:255'],
            ])
            : $request->validate([
                ...$common,
                ...$provisioning,
                'config.host' => ['required', 'string', 'max:255'],
                'config.port' => ['required', 'integer', 'between:1,65535'],
                'config.tls_mode' => ['required', Rule::in(['ldaps', 'starttls', 'plain'])],
                'config.base_dn' => ['required', 'string', 'max:2048'],
                'config.bind_dn' => ['required', 'string', 'max:2048'],
                'config.bind_password' => ['nullable', 'string', 'max:10000'],
                'config.login_attribute' => ['required', 'regex:/^[a-zA-Z][a-zA-Z0-9.-]*$/'],
                'config.user_filter' => ['nullable', 'string', 'max:2048'],
                'config.id_attribute' => ['required', 'regex:/^[a-zA-Z][a-zA-Z0-9.-]*$/'],
                'config.email_attribute' => ['required', 'regex:/^[a-zA-Z][a-zA-Z0-9.-]*$/'],
                'config.name_attribute' => ['required', 'regex:/^[a-zA-Z][a-zA-Z0-9.-]*$/'],
            ]);

        /** @var array{name: string, jit_enabled: bool, config: array<string, mixed>} $config */
        return $config;
    }

    /** @param array<string, mixed> $incoming
     * @return array<string, mixed>
     */
    private function mergeConfig(IdentityProvider $provider, array $incoming): array
    {
        $existing = $provider->configArray();
        foreach (['bind_password', 'idp_certificate', 'sp_certificate', 'sp_private_key'] as $secret) {
            if (($incoming[$secret] ?? '') === '' && isset($existing[$secret])) {
                $incoming[$secret] = $existing[$secret];
            }
        }

        return $incoming;
    }

    private function guard(string $type): void
    {
        $this->features->abortIfDisabled('sso_enabled');
        abort_unless(in_array($type, [IdentityProvider::TYPE_SAML, IdentityProvider::TYPE_LDAP], true), 404);
    }

    /** @return array<string, mixed> */
    private function samlSettingsForValidation(IdentityProvider $provider): array
    {
        return [
            'strict' => true,
            'sp' => [
                'entityId' => route('sso.saml.metadata'),
                'assertionConsumerService' => ['url' => route('sso.saml.acs')],
                'x509cert' => $provider->configString('sp_certificate'),
                'privateKey' => $provider->configString('sp_private_key'),
            ],
            'idp' => [
                'entityId' => $provider->configString('idp_entity_id'),
                'singleSignOnService' => ['url' => $provider->configString('idp_sso_url')],
                'x509cert' => $provider->configString('idp_certificate'),
            ],
        ];
    }
}
