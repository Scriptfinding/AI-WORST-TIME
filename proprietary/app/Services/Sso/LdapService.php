<?php

namespace App\Services\Sso;

use App\Models\IdentityProvider;
use Illuminate\Validation\ValidationException;
use LdapRecord\Connection;

final class LdapService
{
    /** @return array{subject: string, email: string, name: string} */
    public function authenticate(IdentityProvider $provider, string $login, string $password): array
    {
        abort_if($password === '', 422, 'LDAP password is required.');

        $connection = $this->connection($provider);

        try {
            $connection->connect();
            $entry = $this->findUser($connection, $provider, $login);
            $dn = $entry['dn'] ?? null;
            abort_unless(is_string($dn) && $dn !== '', 422, 'LDAP user has no distinguished name.');
            if (! $connection->auth()->attempt($dn, $password)) {
                throw ValidationException::withMessages(['login' => 'Invalid LDAP credentials.']);
            }
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            report($exception);
            throw ValidationException::withMessages(['login' => 'Unable to authenticate with LDAP.']);
        } finally {
            $connection->disconnect();
        }

        $stableId = $this->value($entry, $provider->configString('id_attribute', 'entryUUID'));

        return [
            'subject' => $stableId,
            'email' => $this->value($entry, $provider->configString('email_attribute', 'mail')),
            'name' => $this->value($entry, $provider->configString('name_attribute', 'cn')),
        ];
    }

    public function test(IdentityProvider $provider): void
    {
        $connection = $this->connection($provider);

        try {
            $connection->connect();
            $connection->query()->limit(1)->get();
        } finally {
            $connection->disconnect();
        }
    }

    private function connection(IdentityProvider $provider): Connection
    {
        $mode = $provider->configString('tls_mode', 'starttls');
        $options = [
            LDAP_OPT_REFERRALS => 0,
        ];

        if ($mode !== 'plain') {
            $options[LDAP_OPT_X_TLS_REQUIRE_CERT] = LDAP_OPT_X_TLS_HARD;
        }

        return new Connection([
            'hosts' => [trim($provider->configString('host'))],
            'base_dn' => trim($provider->configString('base_dn')),
            'username' => trim($provider->configString('bind_dn')),
            'password' => $provider->configString('bind_password'),
            'port' => $provider->configInt('port', $mode === 'ldaps' ? 636 : 389),
            'use_tls' => $mode === 'ldaps',
            'use_starttls' => $mode === 'starttls',
            'version' => 3,
            'timeout' => 8,
            'follow_referrals' => false,
            'options' => $options,
        ]);
    }

    /** @return array<int|string, mixed> */
    private function findUser(Connection $connection, IdentityProvider $provider, string $login): array
    {
        $loginAttribute = $provider->configString('login_attribute', 'mail');
        abort_unless((bool) preg_match('/^[a-zA-Z][a-zA-Z0-9.-]*$/', $loginAttribute), 422, 'Invalid LDAP login attribute.');

        $attributes = array_values(array_unique([
            $loginAttribute,
            $provider->configString('id_attribute', 'entryUUID'),
            $provider->configString('email_attribute', 'mail'),
            $provider->configString('name_attribute', 'cn'),
        ]));
        $query = $connection->query()
            ->select($attributes)
            ->where($loginAttribute, '=', $login);
        $filter = trim($provider->configString('user_filter'));
        if ($filter !== '') {
            $query->rawFilter($filter);
        }

        $entries = $query->limit(2)->get();
        if (count($entries) !== 1) {
            throw ValidationException::withMessages(['login' => 'LDAP user was not found or is ambiguous.']);
        }

        $entry = $entries[0];
        abort_unless(is_array($entry), 422, 'LDAP returned an invalid directory entry.');

        return $entry;
    }

    /** @param array<int|string, mixed> $entry */
    private function value(array $entry, string $attribute): string
    {
        $values = $entry[strtolower($attribute)] ?? null;
        $value = is_array($values) ? ($values[0] ?? null) : $values;
        if (is_string($value) && trim($value) !== '') {
            return mb_check_encoding($value, 'UTF-8') ? trim($value) : base64_encode($value);
        }

        throw ValidationException::withMessages(['login' => "LDAP attribute {$attribute} is missing."]);
    }
}
