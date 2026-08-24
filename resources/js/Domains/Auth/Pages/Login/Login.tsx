import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AuthLayout from '@/App/Layout/AuthLayout/AuthLayout';
import Input from '@/Shared/UI/Input/Input';
import EmailCodeFlow from '@/Domains/Auth/Components/Auth/EmailCodeFlow/EmailCodeFlow';
import type { PageProps } from '@/App/types';
import * as Auth from '@/Domains/Auth/Components/Auth/shared.styled';
import * as S from './styled';

interface Props {
    socialProviders?: {
        google?: boolean;
        github?: boolean;
    };
    ssoProviders?: {
        saml?: boolean;
        ldap?: boolean;
    };
}

export default function Login({ socialProviders, ssoProviders }: Props) {
    const { settings } = usePage<{ props: PageProps }>().props as unknown as PageProps;
    const enabledSocialProviders = {
        google: socialProviders?.google ?? false,
        github: socialProviders?.github ?? false,
    };
    const enabledSsoProviders = {
        saml: ssoProviders?.saml ?? false,
        ldap: ssoProviders?.ldap ?? false,
    };
    const hasButtonLogin = enabledSocialProviders.google || enabledSocialProviders.github || enabledSsoProviders.saml;

    const form = useForm({
        email: '',
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/login');
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle={settings.magic_link_enabled
                ? 'Use the code or secure link sent to your email'
                : 'Sign in to your account to continue'}
            footer={settings.invitation_requests_enabled ? (
                <>
                    Need access? <Link href="/register">Request an invitation</Link>
                </>
            ) : undefined}
        >
            {hasButtonLogin && (
                <>
                    <S.SocialLoginGrid>
                        {enabledSsoProviders.saml && (
                            <S.SocialLoginButton href="/sso/saml/login">
                                <Icon icon="lucide:shield-check" width={18} height={18} />
                                Sign in with SAML
                            </S.SocialLoginButton>
                        )}
                        {enabledSocialProviders.google && (
                            <S.SocialLoginButton href="/auth/google/redirect">
                                <Icon icon="logos:google-icon" width={18} height={18} />
                                Sign in with Google
                            </S.SocialLoginButton>
                        )}
                        {enabledSocialProviders.github && (
                            <S.SocialLoginButton href="/auth/github/redirect">
                                <Icon icon="mdi:github" width={18} height={18} />
                                Sign in with GitHub
                            </S.SocialLoginButton>
                        )}
                    </S.SocialLoginGrid>
                </>
            )}
            {hasButtonLogin && (
                <S.Divider>
                    <span>{settings.magic_link_enabled ? 'or continue with email' : 'or sign in with a password'}</span>
                </S.Divider>
            )}
            {settings.magic_link_enabled && (
                <EmailCodeFlow
                    intent="login"
                    remember
                    submitLabel="Send sign-in code"
                />
            )}
            {settings.magic_link_enabled && enabledSsoProviders.ldap && (
                <S.Divider>
                    <span>or use your directory password</span>
                </S.Divider>
            )}
            {(!settings.magic_link_enabled || enabledSsoProviders.ldap) && (
                <Auth.Form onSubmit={handleSubmit}>
                    <Input
                        label="Email"
                        type="email"
                        value={form.data.email}
                        onChange={e => form.setData('email', e.target.value)}
                        error={form.errors.email}
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={form.data.password}
                        onChange={e => form.setData('password', e.target.value)}
                        error={form.errors.password}
                        placeholder="Your password"
                    />
                    <Auth.PrimaryButton type="submit" fullWidth disabled={form.processing}>
                        {form.processing ? 'Signing in...' : 'Sign in'}
                    </Auth.PrimaryButton>
                </Auth.Form>
            )}
        </AuthLayout>
    );
}
