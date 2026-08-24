import { useState, type FormEvent } from 'react';
import { usePage } from '@inertiajs/react';
import { useOtpInput } from '@/Domains/Auth/Components/Auth/OtpInput/OtpInput';
import { useCountdown } from '@/Shared/Hooks/useCountdown';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import {
    loadChallenge,
    responseErrors,
    retrySeconds,
    type EmailCodeErrors,
    type StoredChallenge,
} from './utils';

type EmailAuthIntent = 'login' | 'register';

interface Options {
    intent: EmailAuthIntent;
    initialEmail: string;
    invitationToken?: string;
    requireName: boolean;
    remember: boolean;
}

// Orchestrates requesting, restoring, and verifying the email-code authentication challenge.
export function useEmailCodeChallenge({
    intent,
    initialEmail,
    invitationToken,
    requireName,
    remember,
}: Options) {
    const storageKey = `puppetflow.email-auth.${intent}.${invitationToken ?? 'default'}`;
    const [restoredChallenge] = useState<StoredChallenge | null>(() => loadChallenge(storageKey));
    const pageErrors = usePage<{ errors?: EmailCodeErrors }>().props.errors ?? {};
    const [name, setName] = useState(restoredChallenge?.name ?? '');
    const [email, setEmail] = useState(restoredChallenge?.email ?? initialEmail);
    const [challengeId, setChallengeId] = useState<string | null>(restoredChallenge?.id ?? null);
    const [errors, setErrors] = useState<EmailCodeErrors>(pageErrors);
    const [processing, setProcessing] = useState(false);
    const { countdown: resendWait, setCountdown: setResendWait } = useCountdown(() => restoredChallenge
        ? Math.max(0, Math.ceil((restoredChallenge.resendAvailableAt - Date.now()) / 1000))
        : 0);
    const otp = useOtpInput({ deleteBehavior: 'clear-tail' });
    const canRequest = Boolean(email.trim() && (!requireName || name.trim()));

    const requestCode = async (event?: FormEvent) => {
        event?.preventDefault();
        if (!canRequest || processing) return;

        setProcessing(true);
        setErrors({});

        const response = await fetch('/auth/email/challenge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeaders(),
            },
            body: JSON.stringify({
                email,
                intent,
                name: name.trim() || undefined,
                invitation_token: invitationToken,
                remember,
            }),
        });

        if (!response.ok) {
            const nextErrors = await responseErrors(response);
            setErrors(nextErrors);
            setResendWait(retrySeconds(nextErrors));
            setProcessing(false);
            return;
        }

        const payload = await response.json() as {
            challenge_id: string;
            email: string;
            expires_at: string;
            resend_after_seconds: number;
        };
        const storedChallenge: StoredChallenge = {
            id: payload.challenge_id,
            email: payload.email,
            name: name.trim(),
            expiresAt: payload.expires_at,
            resendAvailableAt: Date.now() + (payload.resend_after_seconds * 1000),
        };
        window.sessionStorage.setItem(storageKey, JSON.stringify(storedChallenge));
        setChallengeId(payload.challenge_id);
        setEmail(payload.email);
        otp.reset();
        setResendWait(payload.resend_after_seconds);
        setProcessing(false);
        window.setTimeout(() => otp.focus(), 0);
    };

    const verifyCode = async (event: FormEvent) => {
        event.preventDefault();
        if (!challengeId || otp.code.length !== 6 || processing) return;

        setProcessing(true);
        setErrors({});

        const response = await fetch('/auth/email/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeaders(),
            },
            body: JSON.stringify({ challenge_id: challengeId, code: otp.code }),
        });

        if (!response.ok) {
            setErrors(await responseErrors(response));
            setProcessing(false);
            return;
        }

        const payload = await response.json() as { redirect: string };
        window.sessionStorage.removeItem(storageKey);
        window.location.assign(payload.redirect);
    };

    // Clears the current challenge so the user can restart with a different email address.
    const useAnotherEmail = () => {
        window.sessionStorage.removeItem(storageKey);
        setChallengeId(null);
        otp.reset();
        setErrors({});
    };

    return {
        canRequest,
        challengeId,
        email,
        errors,
        name,
        otp,
        processing,
        resendWait,
        requestCode,
        setEmail,
        setName,
        useAnotherEmail,
        verifyCode,
    };
}
