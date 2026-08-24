import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { useBeforeUnloadProtection } from '@/Shared/Hooks/useBeforeUnloadProtection';
import type { TabKey } from '@/Domains/Flow/Pages/FlowEditor/types';

type ConfirmFn = (options: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    variant: 'danger';
}) => Promise<boolean>;

interface UseSettingsDirtyProtectionOptions {
    flowId: Id;
    confirm: ConfirmFn;
    switchTab: (tab: TabKey) => void;
}

// Prevents navigation away from unsaved settings until the user confirms.
export function useSettingsDirtyProtection({
    flowId,
    confirm,
    switchTab,
}: UseSettingsDirtyProtectionOptions) {
    const [settingsDirty, setSettingsDirty] = useState(false);
    const settingsLeavePromptOpenRef = useRef(false);
    const allowSettingsNavigationRef = useRef(false);

    const confirmDiscardSettings = useCallback(async () => {
        if (settingsLeavePromptOpenRef.current) return false;

        settingsLeavePromptOpenRef.current = true;
        try {
            return await confirm({
                title: 'Unsaved settings',
                message: 'You have unsaved flow settings. If you leave now, your changes will be lost.',
                confirmLabel: 'Discard changes',
                cancelLabel: 'Keep editing',
                variant: 'danger',
            });
        } finally {
            settingsLeavePromptOpenRef.current = false;
        }
    }, [confirm]);

    const handleSettingsDirtyChange = useCallback((isDirty: boolean) => {
        setSettingsDirty(isDirty);
    }, []);

    const handleSwitchTab = useCallback(async (tab: TabKey) => {
        if (!settingsDirty || tab === 'settings') {
            switchTab(tab);
            return;
        }

        if (await confirmDiscardSettings()) {
            setSettingsDirty(false);
            switchTab(tab);
        }
    }, [confirmDiscardSettings, settingsDirty, switchTab]);

    useEffect(() => {
        if (!settingsDirty) return;

        const removeBeforeListener = router.on('before', event => {
            const visit = event.detail.visit;
            const isCurrentPage = visit.url.pathname === window.location.pathname
                && visit.url.search === window.location.search;
            const isFlowMutation = visit.method !== 'get'
                && visit.url.pathname.startsWith(`/flows/${flowId}`);

            if (
                allowSettingsNavigationRef.current
                || settingsLeavePromptOpenRef.current
                || visit.prefetch
                || isFlowMutation
                || isCurrentPage
            ) {
                if (settingsLeavePromptOpenRef.current) event.preventDefault();
                return;
            }

            event.preventDefault();
            void confirmDiscardSettings().then(shouldLeave => {
                if (!shouldLeave) return;

                allowSettingsNavigationRef.current = true;
                setSettingsDirty(false);
                router.visit(visit.url, {
                    method: visit.method,
                    data: visit.data,
                    replace: visit.replace,
                    preserveScroll: visit.preserveScroll,
                    preserveState: visit.preserveState,
                    only: visit.only,
                    except: visit.except,
                    headers: visit.headers,
                    errorBag: visit.errorBag,
                    forceFormData: visit.forceFormData,
                    queryStringArrayFormat: visit.queryStringArrayFormat,
                    async: visit.async,
                    showProgress: visit.showProgress,
                    fresh: visit.fresh,
                    reset: visit.reset,
                    preserveUrl: visit.preserveUrl,
                    invalidateCacheTags: visit.invalidateCacheTags,
                    viewTransition: visit.viewTransition,
                    onFinish: () => {
                        allowSettingsNavigationRef.current = false;
                    },
                });
            });
        });
        return removeBeforeListener;
    }, [confirmDiscardSettings, flowId, settingsDirty]);

    useBeforeUnloadProtection({ active: settingsDirty, message: '' });

    return {
        handleSettingsDirtyChange,
        handleSwitchTab,
    };
}
