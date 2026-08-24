import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useOtpInput } from '@/Domains/Auth/Components/Auth/OtpInput/OtpInput';
import { useCountdown } from '@/Shared/Hooks/useCountdown';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { responseError, retrySeconds } from '@/Domains/Admin/Pages/Server/utils';

// Coordinates the email challenge required before changing magic-link authentication.
export function useMagicLinkChallenge(initialEnabled: boolean, userEmail: string) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [saving, setSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [email, setEmail] = useState(userEmail);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const {
        countdown: resendWait,
        setCountdown: setResendWait,
        resetCountdown: resetResendWait,
    } = useCountdown(0);
    const otp = useOtpInput({ deleteBehavior: 'clear-current' });

    const request = async () => {
        if (processing) return;

        setProcessing(true);
        setError('');

        let response: Response;
        try {
            response = await fetch('/admin/server/magic-link/challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
            });
        } catch {
            setError('The server could not be reached. Please try again.');
            setProcessing(false);
            return;
        }

        if (!response.ok) {
            const message = await responseError(response);
            setError(message);
            setResendWait(retrySeconds(message));
            setProcessing(false);
            return;
        }

        const payload = await response.json() as {
            challenge_id: string;
            email: string;
            resend_after_seconds: number;
        };
        setChallengeId(payload.challenge_id);
        setEmail(payload.email);
        otp.reset();
        setResendWait(payload.resend_after_seconds);
        setProcessing(false);
        window.setTimeout(() => otp.focus(), 0);
    };

    const close = () => {
        if (processing) return;

        setIsOpen(false);
        setChallengeId(null);
        otp.reset();
        setError('');
        resetResendWait();
    };

    const toggle = (nextEnabled: boolean) => {
        if (nextEnabled) {
            setIsOpen(true);
            setChallengeId(null);
            otp.reset();
            setError('');
            void request();
            return;
        }

        router.put('/admin/server', { magic_link_enabled: false }, {
            preserveState: true,
            onStart: () => setSaving(true),
            onSuccess: () => setEnabled(false),
            onFinish: () => setSaving(false),
        });
    };

    const confirm = async () => {
        if (!challengeId || otp.code.length !== 6 || processing) return;

        setProcessing(true);
        setError('');

        let response: Response;
        try {
            response = await fetch('/admin/server/magic-link', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({
                    challenge_id: challengeId,
                    code: otp.code,
                }),
            });
        } catch {
            setError('The server could not be reached. Please try again.');
            setProcessing(false);
            return;
        }

        if (!response.ok) {
            setError(await responseError(response));
            setProcessing(false);
            return;
        }

        setEnabled(true);
        setProcessing(false);
        setIsOpen(false);
        setChallengeId(null);
        otp.reset();
    };

    return {
        enabled,
        saving,
        isOpen,
        challengeId,
        email,
        otp,
        error,
        processing,
        resendWait,
        toggle,
        close,
        request,
        confirm,
    };
}
