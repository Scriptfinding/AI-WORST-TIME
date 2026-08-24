export interface StoredChallenge {
    id: string;
    email: string;
    name: string;
    expiresAt: string;
    resendAvailableAt: number;
}

export type EmailCodeErrors = Record<string, string>;

export function loadChallenge(key: string): StoredChallenge | null {
    try {
        const value = window.sessionStorage.getItem(key);
        if (!value) return null;

        const challenge = JSON.parse(value) as StoredChallenge;
        if (!challenge.id || !challenge.email || new Date(challenge.expiresAt).getTime() <= Date.now()) {
            window.sessionStorage.removeItem(key);
            return null;
        }

        return challenge;
    } catch {
        return null;
    }
}

export async function responseErrors(response: Response): Promise<EmailCodeErrors> {
    const payload = await response.json().catch(() => ({})) as {
        message?: string;
        errors?: Record<string, string[]>;
    };
    const errors = Object.fromEntries(
        Object.entries(payload.errors ?? {}).map(([key, messages]) => [
            key,
            messages[0] ?? payload.message ?? 'Something went wrong.',
        ]),
    );

    if (Object.keys(errors).length === 0) {
        errors.general = payload.message ?? 'Something went wrong. Please try again.';
    }

    return errors;
}

export function retrySeconds(errors: EmailCodeErrors): number {
    const match = Object.values(errors).join(' ').match(/in\s+(\d+)\s+seconds?/i);
    return match ? Number(match[1]) : 0;
}
