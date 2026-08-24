import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import Modal from '@/Shared/UI/Modal/Modal';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import type { FlowAction } from '@/Domains/Flow/types';
import ActionFormModal from './components/ActionFormModal/ActionFormModal';
import ActionList from './components/ActionList/ActionList';
import useActionsPane from './hooks/useActionsPane';
import type { TeamOption } from './types';
import * as S from './styled';

interface ActionsPaneProps {
    flowId: Id;
    actions: FlowAction[];
    otherActions: FlowAction[];
    teams: TeamOption[];
    groups: string[];
}

export default function ActionsPane({ flowId, actions, otherActions, teams, groups }: ActionsPaneProps) {
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const {
        allGroups, editing, form, group, handleDelete, handleDuplicate, handleScopeChange,
        handleSubmit, handleToggleActive, headers, openCreate, openEdit, ownerId,
        ownershipDisabled, recordingEnabled, scope, setGroup, setHeaders, setOwnerId,
        closeModal, setTargetUserRole, showModal, teamId, confirm, ConfirmModal,
    } = useActionsPane({ flowId, actions, groups });

    useEffect(() => {
        const availableIds = new Set(actions.map(action => action.id));
        setSelectedIds(current => {
            const next = new Set([...current].filter(id => availableIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [actions]);

    const toggleSelected = (actionId: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(actionId)) {
                next.delete(actionId);
            } else {
                next.add(actionId);
            }
            return next;
        });
    };

    const deleteSelected = async () => {
        const selectedActions = actions.filter(action => selectedIds.has(action.id));
        if (selectedActions.length === 0) return;

        const confirmed = await confirm({
            title: selectedActions.length === 1 ? 'Delete Action' : 'Delete Actions',
            message: (
                <BulkDeleteConfirmation
                    description="These actions will no longer run after this flow completes."
                    items={selectedActions.map(action => ({
                        id: action.id,
                        title: action.label,
                        subtitle: action.config?.url || 'Webhook action',
                        icon: <Icon icon="lucide:webhook" width={22} height={22} />,
                    }))}
                />
            ),
            confirmLabel: `Delete (${selectedActions.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        router.delete(`/flows/${flowId}/actions/bulk-delete`, {
            data: { ids: selectedActions.map(action => action.id) },
            preserveState: true,
            onSuccess: () => setSelectedIds(new Set()),
            onFinish: () => setDeletingSelected(false),
        });
    };

    const openCreateWithType = (_type: 'webhook') => {
        setShowTypePicker(false);
        openCreate();
    };

    return (
        <Layout.SidePanelSection>
            <Layout.SidePanelSectionInner>
                <Layout.SectionHeader>
                    <Layout.SectionTitle><Icon icon="lucide:send" width={14} /> Actions</Layout.SectionTitle>
                    <Layout.SectionHeaderActions>
                        {selectedIds.size > 0 && (
                            <Button
                                size="sm"
                                variant="danger"
                                loading={deletingSelected}
                                onClick={deleteSelected}
                            >
                                <Icon icon="lucide:trash-2" width={14} />
                                Delete ({selectedIds.size})
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="secondary"
                            style={{ gap: 4 }}
                            onClick={() => setShowTypePicker(true)}
                        >
                            <Icon icon="lucide:plus" />
                            Add
                        </Button>
                    </Layout.SectionHeaderActions>
                </Layout.SectionHeader>
                <ActionList
                    actions={actions}
                    otherActions={otherActions}
                    selectedIds={selectedIds}
                    onToggleSelected={toggleSelected}
                    onEdit={openEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                />

                <Modal
                    isOpen={showTypePicker}
                    onClose={() => setShowTypePicker(false)}
                    title="Choose action type"
                >
                    <S.TypePickerLayout>
                        <S.TypePickerCard onClick={() => openCreateWithType('webhook')}>
                            <Icon icon="lucide:webhook" width={22} />
                            <S.TypePickerLabel>Webhook</S.TypePickerLabel>
                            <S.TypePickerDesc>Send data to an HTTP endpoint</S.TypePickerDesc>
                        </S.TypePickerCard>
                    </S.TypePickerLayout>
                </Modal>

                <ActionFormModal
                    isOpen={showModal}
                    editing={editing}
                    data={form.data}
                    processing={form.processing}
                    headers={headers}
                    group={group}
                    groups={allGroups}
                    scope={scope}
                    teamId={teamId}
                    ownerId={ownerId}
                    teams={teams}
                    ownershipDisabled={ownershipDisabled}
                    recordingEnabled={recordingEnabled}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    onFieldChange={form.setData}
                    onHeadersChange={setHeaders}
                    onGroupChange={setGroup}
                    onScopeChange={handleScopeChange}
                    onOwnerChange={setOwnerId}
                    onOwnerRoleChange={setTargetUserRole}
                />
            </Layout.SidePanelSectionInner>
            <ConfirmModal />
        </Layout.SidePanelSection>
    );
}
