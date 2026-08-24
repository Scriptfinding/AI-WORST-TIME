import { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { HeaderActions, ButtonLabel } from './styled';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import FeatureUnavailablePanel from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/FeatureUnavailablePanel';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useCurrentWorkspace } from '@/App/Hooks/usePageProps';
import type { UserVariable } from '@/Domains/Variable/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { Integration } from '@/Domains/Integration/types';
import type { PageProps } from '@/App/types';
import VariableTable from './VariableTable/VariableTable';
import VariableFormModal from './VariableFormModal/VariableFormModal';
import VariableImportModal from './VariableImportModal/VariableImportModal';
import VariableUsageModal from './VariableUsageModal';
import useVariablesPage from './useVariablesPage';

interface Props {
    variables: PaginatedData<UserVariable>;
    editingVariable: UserVariable | null;
    groups: string[];
    teams: { id: Id; name: string }[];
    filters: { search: string; group: string | null; scope: string | null };
    isWorkspaceAdmin: boolean;
    vaultIntegrations: Integration[];
}

export default function Variables({ variables, editingVariable, groups, teams, filters, isWorkspaceAdmin }: Props) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const { confirm, ConfirmModal } = useConfirm();
    const currentWorkspace = useCurrentWorkspace();
    const wsColor = currentWorkspace?.icon_color || undefined;
    const modalVariables = useMemo(
        () => editingVariable && !variables.data.some(variable => variable.id === editingVariable.id)
            ? [...variables.data, editingVariable]
            : variables.data,
        [editingVariable, variables.data],
    );
    const page = useVariablesPage(confirm, modalVariables);
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);

    useEffect(() => {
        const availableIds = new Set(variables.data.map(variable => variable.id));
        setSelectedIds(current => {
            const next = new Set([...current].filter(id => availableIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [variables.data]);

    const toggleSelected = (variableId: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(variableId)) {
                next.delete(variableId);
            } else {
                next.add(variableId);
            }
            return next;
        });
    };

    const deleteSelected = async () => {
        const selectedVariables = variables.data.filter(variable => selectedIds.has(variable.id));
        if (selectedVariables.length === 0) return;

        const confirmed = await confirm({
            title: selectedVariables.length === 1 ? 'Delete Variable' : 'Delete Variables',
            message: (
                <BulkDeleteConfirmation
                    description="Flows using these variable keys may fail the next time they run."
                    items={selectedVariables.map(variable => ({
                        id: variable.id,
                        title: variable.key,
                        subtitle: `${variable.type} · ${variable.scope}`,
                        icon: <Icon icon={variable.type === 'secret' ? 'lucide:key-round' : 'lucide:braces'} width={22} height={22} />,
                    }))}
                />
            ),
            confirmLabel: `Delete (${selectedVariables.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        router.delete('/variables/bulk-delete', {
            data: { ids: selectedVariables.map(variable => variable.id) },
            preserveScroll: true,
            onSuccess: () => setSelectedIds(new Set()),
            onFinish: () => setDeletingSelected(false),
        });
    };

    return (
        <AppLayout
            title="Variables"
            headerRight={settings.variables_enabled ? (
                <HeaderActions>
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
                    <Button size="sm" variant="secondary" onClick={page.openImport}>
                        <Icon icon="lucide:upload" width={14} />
                        <ButtonLabel>Import Variables</ButtonLabel>
                    </Button>
                    <Button size="sm" onClick={page.openCreate}>
                        <Icon icon="lucide:plus" width={14} />
                        <ButtonLabel>New Variable</ButtonLabel>
                    </Button>
                </HeaderActions>
            ) : undefined}
        >
            {!settings.variables_enabled ? (
                <FeatureUnavailablePanel />
            ) : (
                <VariableTable
                    variables={variables}
                    groups={groups}
                    teams={teams}
                    filters={filters}
                    wsColor={wsColor}
                    selectedIds={selectedIds}
                    onToggleSelected={toggleSelected}
                    onEdit={page.openEdit}
                    onDelete={page.deleteVariable}
                    onInspect={page.inspectUsages}
                />
            )}

            <VariableFormModal
                editing={page.editingVariable}
                groups={groups}
                teams={teams}
                isWorkspaceAdmin={isWorkspaceAdmin}
                isOpen={page.isFormOpen}
                onClose={page.closeForm}
                confirm={confirm}
            />

            <VariableImportModal
                isOpen={page.isImportOpen}
                onClose={page.closeImport}
                groups={groups}
                teams={teams}
                confirm={confirm}
            />

            <VariableUsageModal
                variable={page.inspectedVariable}
                usages={page.inspectedUsages}
                loading={page.isInspectingUsages}
                onClose={page.closeUsageInspection}
            />

            <ConfirmModal />
        </AppLayout>
    );
}
