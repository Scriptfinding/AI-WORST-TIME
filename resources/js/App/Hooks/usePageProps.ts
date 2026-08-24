import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/App/types';

// Returns the application-specific props attached to the current Inertia page.
export function usePageProps() {
    return usePage<{ props: PageProps }>().props as unknown as PageProps;
}

// Selects the authenticated user data from the current Inertia page.
export function useAuth() {
    const { auth } = usePageProps();
    return auth;
}

// Selects the active workspace from the current Inertia page.
export function useCurrentWorkspace() {
    const { currentWorkspace } = usePageProps();
    return currentWorkspace;
}

// Selects server-provided flash messages from the current Inertia page.
export function useFlash() {
    const { flash } = usePageProps();
    return flash;
}
