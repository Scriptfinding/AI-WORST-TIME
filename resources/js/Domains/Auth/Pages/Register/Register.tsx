import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@/App/Layout/AuthLayout/AuthLayout';
import EmailCodeFlow from '@/Domains/Auth/Components/Auth/EmailCodeFlow/EmailCodeFlow';
import Input from '@/Shared/UI/Input/Input';
import type { PageProps } from '@/App/types';
import {
    Form as AuthForm,
    PrimaryButton as AuthPrimaryButton,
} from '@/Domains/Auth/Components/Auth/shared.styled';
import * as S from './styled';

interface Props {
    firstUserSetup: boolean;
    registrationSubmitted: boolean;
    invitation?: {
        token: string;
        email: string;
        workspace: string;
        registrationSubmitted: boolean;
    } | null;
}

export default function Register({ firstUserSetup, registrationSubmitted, invitation }: Props) {
    const { settings, branding } = usePage<{ props: PageProps }>().props as unknown as PageProps;
    const form = useForm({
        name: '',
        email: invitation?.email ?? '',
        password: '',
        password_confirmation: '',
        invitation_token: invitation?.token ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/register');
    };

    const title = invitation
        ? `Accept invitation to ${invitation.workspace}`
        : firstUserSetup
            ? 'Set up Puppetflow'
            : 'Request an invitation';
    const subtitle = invitation
        ? `Create your account to join ${invitation.workspace}.`
        : firstUserSetup
            ? 'Create the administrator account for this instance.'
            : `Submit a request to join ${branding.name}. An administrator will assign your workspaces.`;

    if (registrationSubmitted || invitation?.registrationSubmitted) {
        return (
            <AuthLayout
                title="Approval pending"
                subtitle={invitation
                    ? `Your request to join ${invitation.workspace} was sent to a workspace administrator.`
                    : 'Your invitation request was sent to an administrator.'}
                footer={<Link href="/login">Back to sign in</Link>}
            >
                <S.InviteBanner>
                    You can sign in after an administrator approves your account.
                </S.InviteBanner>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title={title}
            subtitle={subtitle}
            footer={!firstUserSetup && (
                <>
                    Already have an account?{' '}
                    <Link href="/login">Sign in</Link>
                </>
            )}
        >
            {invitation && (
                <S.InviteBanner>
                    This account will be added to <strong>{invitation.workspace}</strong>.
                </S.InviteBanner>
            )}
            {settings.magic_link_enabled ? (
                <EmailCodeFlow
                    intent="register"
                    initialEmail={invitation?.email}
                    invitationToken={invitation?.token}
                    requireName
                    submitLabel={
                        invitation
                            ? 'Verify email and join'
                            : firstUserSetup
                                ? 'Verify email and create administrator'
                                : 'Verify email and submit request'
                    }
                />
            ) : (
                <AuthForm onSubmit={handleSubmit}>
                    <Input
                        label="Name"
                        value={form.data.name}
                        onChange={e => form.setData('name', e.target.value)}
                        error={form.errors.name}
                        placeholder="Your name"
                        autoFocus
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={form.data.email}
                        onChange={e => form.setData('email', e.target.value)}
                        error={form.errors.email}
                        placeholder="you@example.com"
                        disabled={!!invitation}
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={form.data.password}
                        onChange={e => form.setData('password', e.target.value)}
                        error={form.errors.password}
                        placeholder="Min. 8 characters"
                    />
                    <Input
                        label="Confirm password"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={e => form.setData('password_confirmation', e.target.value)}
                        placeholder="Same password"
                    />
                    <AuthPrimaryButton type="submit" fullWidth disabled={form.processing}>
                        {form.processing
                            ? (firstUserSetup ? 'Creating account...' : 'Submitting request...')
                            : invitation
                                ? 'Accept invitation'
                                : firstUserSetup
                                    ? 'Create administrator account'
                                    : 'Submit invitation request'}
                    </AuthPrimaryButton>
                </AuthForm>
            )}
        </AuthLayout>
    );
}
