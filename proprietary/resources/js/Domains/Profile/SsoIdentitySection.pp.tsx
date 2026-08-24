import React from 'react';
import { useForm } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button, { ButtonLink } from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import type { LinkedSsoIdentity, ProfileSso } from '@/Domains/Profile/types';
import * as S from './SsoIdentitySection.styled.pp';

interface UnlinkFormProps {
    type: 'saml' | 'ldap';
    identity: LinkedSsoIdentity;
}

function UnlinkForm({ type, identity }: UnlinkFormProps) {
    const form = useForm({ current_password: '' });

    const unlink = (event: React.FormEvent) => {
        event.preventDefault();
        form.delete(`/profile/sso/${type}`, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <S.Identity>
                <S.IdentityName>{identity.name}</S.IdentityName>
                {identity.email ?? 'No email was supplied by this provider'}
            </S.Identity>
            <S.Unlink>
                <S.Hint>
                    Enter your current Puppetflow password. It is required when this is your last external sign-in method.
                </S.Hint>
                <S.Form onSubmit={unlink}>
                    <Input
                        label="Current password"
                        type="password"
                        value={form.data.current_password}
                        error={form.errors.current_password}
                        autoComplete="current-password"
                        onChange={event => form.setData('current_password', event.target.value)}
                    />
                    <div>
                        <Button type="submit" variant="danger" size="sm" loading={form.processing}>
                            Unlink {type.toUpperCase()}
                        </Button>
                    </div>
                </S.Form>
            </S.Unlink>
        </>
    );
}

function SamlProvider({ sso }: { sso: ProfileSso }) {
    const identity = sso.linked.saml;

    return (
        <S.Provider>
            <S.ProviderHeader>
                <S.ProviderName>
                    <Icon icon="lucide:shield-check" width={16} />
                    SAML
                </S.ProviderName>
                <S.Status $linked={Boolean(identity)}>{identity ? 'Linked' : 'Available'}</S.Status>
            </S.ProviderHeader>
            {identity ? (
                <UnlinkForm type="saml" identity={identity} />
            ) : (
                <>
                    <S.Hint>Connect your company identity through the configured SAML provider.</S.Hint>
                    <div>
                        <ButtonLink href="/profile/sso/saml/link" size="sm">
                            Link SAML identity
                        </ButtonLink>
                    </div>
                </>
            )}
        </S.Provider>
    );
}

function LdapProvider({ sso }: { sso: ProfileSso }) {
    const identity = sso.linked.ldap;
    const form = useForm({ login: '', password: '' });

    const link = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/profile/sso/ldap/link', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <S.Provider>
            <S.ProviderHeader>
                <S.ProviderName>
                    <Icon icon="lucide:network" width={16} />
                    LDAP
                </S.ProviderName>
                <S.Status $linked={Boolean(identity)}>{identity ? 'Linked' : 'Available'}</S.Status>
            </S.ProviderHeader>
            {identity ? (
                <UnlinkForm type="ldap" identity={identity} />
            ) : (
                <S.Form onSubmit={link}>
                    <Input
                        label="Directory username"
                        value={form.data.login}
                        error={form.errors.login}
                        autoComplete="username"
                        required
                        onChange={event => form.setData('login', event.target.value)}
                    />
                    <Input
                        label="Directory password"
                        type="password"
                        value={form.data.password}
                        error={form.errors.password}
                        autoComplete="current-password"
                        required
                        onChange={event => form.setData('password', event.target.value)}
                    />
                    <div>
                        <Button type="submit" size="sm" loading={form.processing}>
                            Link LDAP identity
                        </Button>
                    </div>
                </S.Form>
            )}
        </S.Provider>
    );
}

export default function SsoIdentitySection({ sso }: { sso: ProfileSso }) {
    if (!sso.enabled) return null;

    const showSaml = sso.providers.saml || Boolean(sso.linked.saml);
    const showLdap = sso.providers.ldap || Boolean(sso.linked.ldap);

    return (
        <S.Card>
            <S.Header>
                <S.Title>
                    <Icon icon="lucide:key-round" width={15} />
                    Company identities
                </S.Title>
                <S.Subtitle>Link a company identity to use it as an additional sign-in method.</S.Subtitle>
            </S.Header>
            {showSaml || showLdap ? (
                <S.ProviderGrid>
                    {showSaml && <SamlProvider sso={sso} />}
                    {showLdap && <LdapProvider sso={sso} />}
                </S.ProviderGrid>
            ) : (
                <S.Empty>No company identity provider is currently available.</S.Empty>
            )}
        </S.Card>
    );
}
