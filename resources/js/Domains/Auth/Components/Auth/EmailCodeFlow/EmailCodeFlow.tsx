import Input from '@/Shared/UI/Input/Input';
import OtpInput from '@/Domains/Auth/Components/Auth/OtpInput/OtpInput';
import * as Auth from '@/Domains/Auth/Components/Auth/shared.styled';
import { useEmailCodeChallenge } from './useEmailCodeChallenge';
import * as S from './styled';

type EmailAuthIntent = 'login' | 'register';

interface EmailCodeFlowProps {
    intent: EmailAuthIntent;
    initialEmail?: string;
    invitationToken?: string;
    requireName?: boolean;
    remember?: boolean;
    submitLabel?: string;
}

export default function EmailCodeFlow({
    intent,
    initialEmail = '',
    invitationToken,
    requireName = false,
    remember = false,
    submitLabel = 'Continue with email',
}: EmailCodeFlowProps) {
    const challenge = useEmailCodeChallenge({
        intent,
        initialEmail,
        invitationToken,
        requireName,
        remember,
    });

    if (challenge.challengeId) {
        const error = challenge.errors.code
            ?? challenge.errors.email
            ?? challenge.errors.general;

        return (
            <S.CodeStage>
                <S.CodeHint>
                    We sent a six-digit code and a secure sign-in link to <strong>{challenge.email}</strong>.
                </S.CodeHint>
                <Auth.Form onSubmit={challenge.verifyCode}>
                    <OtpInput controller={challenge.otp} />
                    {error && <S.ErrorText>{error}</S.ErrorText>}
                    <Auth.PrimaryButton
                        type="submit"
                        fullWidth
                        disabled={challenge.otp.code.length !== 6 || challenge.processing}
                    >
                        {challenge.processing ? 'Verifying...' : 'Verify and continue'}
                    </Auth.PrimaryButton>
                    <S.TextButton
                        type="button"
                        disabled={challenge.processing || challenge.resendWait > 0}
                        onClick={() => { void challenge.requestCode(); }}
                    >
                        {challenge.resendWait > 0
                            ? `Send a new code in ${challenge.resendWait}s`
                            : 'Send a new code'}
                    </S.TextButton>
                </Auth.Form>
                <S.TextButton type="button" onClick={challenge.useAnotherEmail}>
                    Use another email
                </S.TextButton>
            </S.CodeStage>
        );
    }

    return (
        <Auth.Form onSubmit={challenge.requestCode}>
            {requireName && (
                <Input
                    label="Name"
                    value={challenge.name}
                    onChange={event => challenge.setName(event.target.value)}
                    error={challenge.errors.name}
                    placeholder="Your name"
                    autoComplete="name"
                    autoFocus
                />
            )}
            <Input
                label="Email"
                type="email"
                value={challenge.email}
                onChange={event => challenge.setEmail(event.target.value)}
                error={challenge.errors.email ?? challenge.errors.general}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus={!requireName}
                disabled={Boolean(invitationToken)}
            />
            <Auth.PrimaryButton
                type="submit"
                fullWidth
                disabled={!challenge.canRequest || challenge.processing}
            >
                {challenge.processing ? 'Sending code...' : submitLabel}
            </Auth.PrimaryButton>
        </Auth.Form>
    );
}
