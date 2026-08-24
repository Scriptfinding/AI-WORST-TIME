import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import * as S from './SetupView.styled';

interface Props {
    qrSvg: string;
    secret: string;
}

export default function SetupView({ qrSvg, secret }: Props) {
    const form = useForm({ code: '' });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/two-factor/enable', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <S.Description>
                Scan the QR code below with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
            </S.Description>

            <S.QrWrapper dangerouslySetInnerHTML={{ __html: qrSvg }} />

            <S.SecretBox>
                <S.SecretLabel>Or enter this key manually</S.SecretLabel>
                <S.SecretValue>{secret}</S.SecretValue>
            </S.SecretBox>

            <S.Form onSubmit={handleSubmit}>
                <Input
                    label="Verification Code"
                    value={form.data.code}
                    onChange={event => form.setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))}
                    error={form.errors.code}
                    placeholder="000000"
                    inputMode="numeric"
                    autoFocus
                />
                <Button type="submit" fullWidth disabled={form.processing || form.data.code.length !== 6}>
                    {form.processing ? 'Verifying...' : 'Verify & Enable'}
                </Button>
            </S.Form>
        </>
    );
}
