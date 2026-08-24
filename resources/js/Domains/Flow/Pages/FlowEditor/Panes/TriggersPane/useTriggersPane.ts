import { useAuth } from '@/App/Hooks/usePageProps';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useToast } from '@/App/Hooks/useToast';
import type { FlowTrigger } from '@/Domains/Flow/types';
import { useTriggerActions } from './hooks/useTriggerActions';
import { useTriggerFormModal } from './hooks/useTriggerFormModal';
import { useClock } from './useClock';

interface UseTriggersPaneOptions {
    flowId: Id;
    triggers: FlowTrigger[];
    groups: string[];
}

// Supplies TriggersPane with grouped data and trigger modal actions.
export function useTriggersPane({ flowId, triggers, groups }: UseTriggersPaneOptions) {
    const { toast } = useToast();
    const { confirm, ConfirmModal } = useConfirm();
    const { user } = useAuth();
    const userTz = user?.timezone || 'UTC';
    const userTime = useClock(userTz);
    const currentUserId = user?.id ?? '';
    const currentUserWorkspaceRole = (
        user as typeof user & { workspace_role?: 'admin' | 'manager' | 'member' }
    )?.workspace_role ?? 'member';
    const formModal = useTriggerFormModal({
        flowId,
        triggers,
        currentUserId,
        currentUserWorkspaceRole,
        confirm,
    });
    const actions = useTriggerActions({ flowId, triggers, groups, confirm, toast });

    return {
        ...actions,
        ...formModal,
        confirm,
        ConfirmModal,
        userTime,
        userTz,
    };
}
