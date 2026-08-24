import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import type { MailboxDomainModalProps, MailboxDomainModalView } from './types';

type NavigationOptions = Pick<MailboxDomainModalProps, 'mode' | 'onClose'> & {
    editIntegrationId: Id | null;
};

// Tracks the mailbox modal view and preserves the integration created mid-flow.
export default function useMailboxModalNavigation({
    mode,
    onClose,
    editIntegrationId,
}: NavigationOptions) {
    const [view, setView] = useState<MailboxDomainModalView>(
        mode === 'create' ? 'form' : 'domain-list'
    );
    const [createdIntegrationId, setCreatedIntegrationId] = useState<Id | null>(
        editIntegrationId
    );
    const integrationId = editIntegrationId ?? createdIntegrationId;

    const handleClose = useCallback(() => {
        if (createdIntegrationId || mode === 'edit') router.reload();
        onClose();
    }, [createdIntegrationId, mode, onClose]);

    const showDomainSetup = useCallback(() => {
        setView('domain-setup');
    }, []);

    const showDomainList = useCallback(() => {
        setView('domain-list');
    }, []);

    return {
        view,
        integrationId,
        createdIntegrationId,
        setCreatedIntegrationId,
        handleClose,
        showDomainSetup,
        showDomainList,
    };
}
