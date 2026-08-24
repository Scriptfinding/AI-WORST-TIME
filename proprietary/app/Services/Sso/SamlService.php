<?php

namespace App\Services\Sso;

use App\Models\IdentityProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OneLogin\Saml2\Auth;
use OneLogin\Saml2\IdPMetadataParser;
use OneLogin\Saml2\Settings;

final class SamlService
{
    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function importMetadata(array $config): array
    {
        $xml = trim($this->arrayString($config, 'metadata_xml'));
        $url = trim($this->arrayString($config, 'metadata_url'));

        if ($xml === '' && $url !== '') {
            $this->assertSafeMetadataUrl($url);
            $response = Http::timeout(8)
                ->connectTimeout(3)
                ->withoutRedirecting()
                ->accept('application/xml')
                ->get($url);
            abort_unless($response->successful(), 422, 'Unable to fetch SAML metadata.');
            abort_if(strlen($response->body()) > 2_000_000, 422, 'SAML metadata is too large.');
            $xml = $response->body();
        }

        if ($xml === '') {
            return $config;
        }

        try {
            $metadata = IdPMetadataParser::parseXML($xml);
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages(['metadata_xml' => 'Invalid SAML metadata.']);
        }

        $idp = is_array($metadata['idp'] ?? null) ? $metadata['idp'] : [];
        $certificate = $idp['x509cert'] ?? null;
        if (! is_scalar($certificate)) {
            $certificate = $idp['x509certMulti']['signing'][0] ?? null;
        }

        return [
            ...$config,
            'idp_entity_id' => is_scalar($idp['entityId'] ?? null) ? (string) $idp['entityId'] : '',
            'idp_sso_url' => is_scalar($idp['singleSignOnService']['url'] ?? null)
                ? (string) $idp['singleSignOnService']['url']
                : '',
            'idp_certificate' => is_scalar($certificate) ? (string) $certificate : '',
        ];
    }

    public function redirectUrl(IdentityProvider $provider, Request $request, bool $linking = false): string
    {
        $auth = new Auth($this->settings($provider));
        $state = Str::random(64);
        $returnTo = route('sso.saml.acs', ['state' => $state]);
        $url = $auth->login($returnTo, [], false, false, true);
        Cache::put('saml-request:'.hash('sha256', $state), [
            'request_id' => $auth->getLastRequestID(),
            'linking_user_id' => $linking ? $request->user()?->getAuthIdentifier() : null,
        ], now()->addMinutes(10));

        return $url;
    }

    /** @return array{subject: string, email: string, name: string, linking_user_id: string|null} */
    public function consume(IdentityProvider $provider, Request $request): array
    {
        $state = $this->stateFromRequest($request);
        $correlation = Cache::pull('saml-request:'.hash('sha256', $state));
        abort_unless(is_array($correlation), 400, 'Missing or expired SAML request correlation.');
        $requestId = $correlation['request_id'] ?? null;
        abort_unless(is_string($requestId) && $requestId !== '', 400, 'Missing SAML request correlation.');

        $auth = new Auth($this->settings($provider));
        $auth->processResponse($requestId);
        if (! $auth->isAuthenticated() || $auth->getErrors() !== []) {
            throw ValidationException::withMessages([
                'sso' => $auth->getLastErrorReason() ?: 'SAML authentication failed.',
            ]);
        }

        $responseId = (string) $auth->getLastMessageId();
        if ($responseId !== '' && ! Cache::add('saml-response:'.hash('sha256', $responseId), true, now()->addMinutes(10))) {
            abort(409, 'SAML response replay detected.');
        }

        $attributes = $auth->getAttributes();
        $email = $this->attribute($attributes, $provider->configString('email_attribute', 'email'));
        $firstName = $this->attribute($attributes, $provider->configString('first_name_attribute', 'firstName'), false);
        $lastName = $this->attribute($attributes, $provider->configString('last_name_attribute', 'lastName'), false);
        $immutableAttribute = trim($provider->configString('subject_attribute'));
        $externalId = $immutableAttribute === ''
            ? (string) $auth->getNameId()
            : $this->attribute($attributes, $immutableAttribute);

        return [
            'subject' => trim($provider->configString('idp_entity_id')).'|'.$externalId,
            'email' => $email,
            'name' => trim($firstName.' '.$lastName),
            'linking_user_id' => is_string($correlation['linking_user_id'] ?? null)
                ? $correlation['linking_user_id']
                : null,
        ];
    }

    public function metadata(IdentityProvider $provider): string
    {
        $settings = new Settings($this->settings($provider), true);
        $metadata = $settings->getSPMetadata();
        $errors = $settings->validateMetadata($metadata);
        abort_if($errors !== [], 500, implode(', ', $errors));

        return $metadata;
    }

    /** @return array<string, mixed> */
    private function settings(IdentityProvider $provider): array
    {
        $privateKey = trim($provider->configString('sp_private_key'));
        $certificate = trim($provider->configString('sp_certificate'));

        return [
            'strict' => true,
            'debug' => false,
            'sp' => [
                'entityId' => route('sso.saml.metadata'),
                'assertionConsumerService' => [
                    'url' => route('sso.saml.acs'),
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
                ],
                'x509cert' => $certificate,
                'privateKey' => $privateKey,
            ],
            'idp' => [
                'entityId' => trim($provider->configString('idp_entity_id')),
                'singleSignOnService' => [
                    'url' => trim($provider->configString('idp_sso_url')),
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ],
                'x509cert' => trim($provider->configString('idp_certificate')),
            ],
            'security' => [
                'authnRequestsSigned' => $privateKey !== '' && $certificate !== '',
                'wantAssertionsSigned' => true,
                'wantMessagesSigned' => false,
                'wantNameId' => true,
                'rejectUnsolicitedResponsesWithInResponseTo' => true,
                'requestedAuthnContext' => false,
            ],
        ];
    }

    /** @param array<string, list<string>> $attributes */
    private function attribute(array $attributes, string $name, bool $required = true): string
    {
        $value = trim((string) ($attributes[$name][0] ?? ''));
        if ($required && $value === '') {
            throw ValidationException::withMessages(['sso' => "SAML attribute {$name} is missing."]);
        }

        return $value;
    }

    private function assertSafeMetadataUrl(string $url): void
    {
        $parts = parse_url($url);
        $host = is_array($parts) ? ($parts['host'] ?? null) : null;
        if (($parts['scheme'] ?? null) !== 'https' || ! is_string($host)) {
            throw ValidationException::withMessages(['metadata_url' => 'Metadata URL must use HTTPS.']);
        }

        $addresses = gethostbynamel($host) ?: [];
        if ($addresses === []) {
            throw ValidationException::withMessages(['metadata_url' => 'Metadata host could not be resolved.']);
        }

        foreach ($addresses as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                throw ValidationException::withMessages(['metadata_url' => 'Metadata URL resolves to a private address.']);
            }
        }
    }

    private function stateFromRequest(Request $request): string
    {
        $state = $request->input('state');
        if (! is_string($state) || $state === '') {
            $relayState = $request->input('RelayState');
            if (is_string($relayState)) {
                parse_str((string) parse_url($relayState, PHP_URL_QUERY), $query);
                $state = $query['state'] ?? null;
            }
        }

        abort_unless(is_string($state) && strlen($state) === 64, 400, 'Invalid SAML relay state.');

        return $state;
    }

    /** @param array<string, mixed> $values */
    private function arrayString(array $values, string $key): string
    {
        $value = $values[$key] ?? null;

        return is_scalar($value) ? (string) $value : '';
    }
}
