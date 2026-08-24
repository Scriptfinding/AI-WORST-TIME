import React, { createContext, useCallback, useContext, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { ToastContainer, ToastItem } from './useToast.styled';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    variant: ToastVariant;
}

const VARIANT_ICON: Record<ToastVariant, string> = {
    success: 'lucide:check-circle',
    error: 'lucide:alert-circle',
    info: 'lucide:info',
};

interface ToastContextValue {
    toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, variant: ToastVariant = 'success') => {
        const id = ++nextId;
        setToasts(prev => [...prev, { id, message, variant }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2000);
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {toasts.length > 0 && (
                <ToastContainer>
                    {toasts.map(t => (
                        <ToastItem key={t.id}>
                            <Icon icon={VARIANT_ICON[t.variant]} width={14} height={14} />
                            {t.message}
                        </ToastItem>
                    ))}
                </ToastContainer>
            )}
        </ToastContext.Provider>
    );
}

// Gives components access to the shared transient toast notifier.
export function useToast() {
    return useContext(ToastContext);
}
