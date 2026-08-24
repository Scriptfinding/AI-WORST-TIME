import { useState } from 'react';

// Holds the one-time API key secret until the user dismisses it.
export function useApiKeyReveal(initialKey: string | null) {
    const [revealedKey, setRevealedKey] = useState<string | null>(initialKey);

    return {
        revealedKey,
        dismissRevealedKey: () => setRevealedKey(null),
        revealKey: setRevealedKey,
    };
}
