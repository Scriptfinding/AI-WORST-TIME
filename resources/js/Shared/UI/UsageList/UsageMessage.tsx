import type React from 'react';

interface UsageMessageProps {
    children: React.ReactNode;
    prompt: React.ReactNode;
    separator?: React.ReactNode;
}

export function UsageMessage({ children, prompt, separator = '\n' }: UsageMessageProps) {
    return (
        <>
            {children}
            {separator}
            {prompt}
        </>
    );
}
