import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '@/App/Layout/AuthLayout/AuthLayout';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import { Form } from '@/Domains/Auth/Components/Auth/shared.styled';
import * as S from './styled';

export default function TwoFactorChallenge() {
    const [useRecovery, setUseRecovery] = useState(false);

    const form = useForm({
        code: '',
        recovery_code: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/two-factor/challenge');
    };

    return (
        <AuthLayout
            title="Two-Factor Authentication"
            subtitle={
                useRecovery
                    ? 'Enter one of your recovery codes to regain access'
                    : 'Enter the 6-digit code from your authenticator app'
            }
        >
            <Form onSubmit={handleSubmit}>
                {useRecovery ? (
                    <Input
                        label="Recovery Code"
                        value={form.data.recovery_code}
                        onChange={e => form.setData('recovery_code', e.target.value)}
                        error={form.errors.recovery_code}
                        placeholder="xxxxxxxxxx"
                        autoFocus
                    />
                ) : (
                    <Input
                        label="Authentication Code"
                        value={form.data.code}
                        onChange={e => form.setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        error={form.errors.code}
                        placeholder="000000"
                        autoFocus
                        inputMode="numeric"
                    />
                )}

                <Button type="submit" fullWidth disabled={form.processing}>
                    {form.processing ? 'Verifying...' : 'Verify'}
                </Button>

                <S.RecoveryToggle
                    type="button"
                    onClick={() => {
                        setUseRecovery(!useRecovery);
                        form.clearErrors();
                    }}
                >
                    {useRecovery ? 'Use authentication code' : 'Use a recovery code'}
                </S.RecoveryToggle>
            </Form>
        </AuthLayout>
    );
}
