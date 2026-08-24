import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import type { FlowTrigger } from '@/Domains/Flow/types';
import TriggerFormModal from './components/TriggerFormModal/TriggerFormModal';
import TriggerList from './components/TriggerList/TriggerList';
import TriggerTypePicker from './components/TriggerTypePicker/TriggerTypePicker';
import type { TeamOption } from './types';
import { useTriggersPane } from './useTriggersPane';

interface TriggersPaneProps {
    flowId: Id;
    triggers: FlowTrigger[];
    otherTriggers: FlowTrigger[];
    teams: TeamOption[];
    groups: string[];
}

export default function TriggersPane({ flowId, triggers, otherTriggers, teams, groups }: TriggersPaneProps) {
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const {
        allGroups,
        confirm,
        ConfirmModal,
        copyEndpoint,
        editing,
        form,
        group,
        handleDelete,
        handleDuplicate,
        handlePresetChange,
        handleSubmit,
        handleToggleActive,
        closeModal,
        openCreateWithType,
        openEdit,
        ownerId,
        ownershipDisabled,
        scope,
        setGroup,
        setOwnerId,
        setScope,
        setShowInputTemplate,
        setShowTypePicker,
        setTargetUserRole,
        setTeamId,
        showInputTemplate,
        showModal,
        showTypePicker,
        teamId,
        userTime,
        userTz,
    } = useTriggersPane({ flowId, triggers, groups });

    useEffect(() => {
        const availableIds = new Set(triggers.map(trigger => trigger.id));
        setSelectedIds(current => {
            const next = new Set([...current].filter(id => availableIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [triggers]);

    const toggleSelected = (triggerId: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(triggerId)) {
                next.delete(triggerId);
            } else {
                next.add(triggerId);
            }
            return next;
        });
    };

    const deleteSelected = async () => {
        const selectedTriggers = triggers.filter(trigger => selectedIds.has(trigger.id));
        if (selectedTriggers.length === 0) return;

        const confirmed = await confirm({
            title: selectedTriggers.length === 1 ? 'Delete Trigger' : 'Delete Triggers',
            message: (
                <BulkDeleteConfirmation
                    description="These entry points will stop starting this flow immediately after deletion."
                    items={selectedTriggers.map(trigger => ({
                        id: trigger.id,
                        title: trigger.label,
                        subtitle: trigger.type === 'webhook' ? 'Webhook endpoint' : 'Scheduled trigger',
                        icon: <Icon icon={trigger.type === 'webhook' ? 'lucide:webhook' : 'lucide:clock'} width={22} height={22} />,
                    }))}
                />
            ),
            confirmLabel: `Delete (${selectedTriggers.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        router.delete(`/flows/${flowId}/triggers/bulk-delete`, {
            data: { ids: selectedTriggers.map(trigger => trigger.id) },
            preserveState: true,
            onSuccess: () => setSelectedIds(new Set()),
            onFinish: () => setDeletingSelected(false),
        });
    };

    return (
        <Layout.SidePanelSection>
            <Layout.SidePanelSectionInner>
                <Layout.SectionHeader>
                    <Layout.SectionTitle><Icon icon="lucide:zap" width={14} /> Triggers</Layout.SectionTitle>
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
                <TriggerList
                    triggers={triggers}
                    otherTriggers={otherTriggers}
                    selectedIds={selectedIds}
                    onToggleSelected={toggleSelected}
                    onEdit={openEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onCopyEndpoint={copyEndpoint}
                />
                <TriggerTypePicker
                    isOpen={showTypePicker}
                    onClose={() => setShowTypePicker(false)}
                    onSelect={openCreateWithType}
                />
                <TriggerFormModal
                    flowId={flowId}
                    isOpen={showModal}
                    editing={editing}
                    data={form.data}
                    processing={form.processing}
                    group={group}
                    groups={allGroups}
                    scope={scope}
                    teamId={teamId}
                    ownerId={ownerId}
                    teams={teams}
                    ownershipDisabled={ownershipDisabled}
                    showInputTemplate={showInputTemplate}
                    timezone={userTz}
                    userTime={userTime}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    onFieldChange={form.setData}
                    onGroupChange={setGroup}
                    onScopeChange={(newScope, newTeamId) => {
                        setScope(newScope);
                        setTeamId(newTeamId);
                    }}
                    onOwnerChange={setOwnerId}
                    onOwnerRoleChange={setTargetUserRole}
                    onCronPresetChange={handlePresetChange}
                    onInputTemplateVisibilityChange={setShowInputTemplate}
                    onCopyEndpoint={copyEndpoint}
                />
            </Layout.SidePanelSectionInner>
            <ConfirmModal />
        </Layout.SidePanelSection>
    );
}
