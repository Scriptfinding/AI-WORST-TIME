import React, { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import type { UserVariable } from '@/Domains/Variable/types';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import VariableDeleteConfirmation from './VariableDeleteConfirmation';
import type { VariableUsage } from './types';

interface ConfirmOptions {
    title?: string;
    message: React.ReactNode;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

async function fetchVariableUsages(variableId: Id): Promise<VariableUsage[]> {
    const response = await fetch(`/variables/${variableId}/usages`);
    return response.json();
}

// Coordinates variable dialogs and loads usage details before destructive actions.
export default function useVariablesPage(confirm: Confirm, variables: UserVariable[]) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const {
        selectedItem: editingVariable,
        openModal: openEditingVariable,
        closeModal: closeEditingVariable,
    } = useUrlSyncedModal(variables, 'edit');
    const [inspectedVariable, setInspectedVariable] = useState<UserVariable | null>(null);
    const [inspectedUsages, setInspectedUsages] = useState<VariableUsage[]>([]);
    const [isInspectingUsages, setIsInspectingUsages] = useState(false);

    useEffect(() => {
        if (editingVariable) setIsFormOpen(true);
    }, [editingVariable]);

    const openCreate = useCallback(() => {
        closeEditingVariable();
        setIsFormOpen(true);
    }, [closeEditingVariable]);

    const openEdit = useCallback((variable: UserVariable) => {
        openEditingVariable(variable);
        setIsFormOpen(true);
    }, [openEditingVariable]);

    const closeForm = useCallback(() => {
        setIsFormOpen(false);
        closeEditingVariable();
    }, [closeEditingVariable]);
    const openImport = useCallback(() => setIsImportOpen(true), []);
    const closeImport = useCallback(() => setIsImportOpen(false), []);
    const closeUsageInspection = useCallback(() => setInspectedVariable(null), []);

    const inspectUsages = useCallback(async (variable: UserVariable) => {
        setInspectedVariable(variable);
        setInspectedUsages([]);
        setIsInspectingUsages(true);

        try {
            setInspectedUsages(await fetchVariableUsages(variable.id));
        } catch {
            // Keep the empty state when usage inspection is unavailable.
        } finally {
            setIsInspectingUsages(false);
        }
    }, []);

    const deleteVariable = useCallback(async (variable: UserVariable) => {
        let usages: VariableUsage[] = [];

        try {
            usages = await fetchVariableUsages(variable.id);
        } catch {
            // Deletion can continue without usage information.
        }

        const confirmed = await confirm({
            title: 'Delete Variable',
            message: usages.length > 0
                ? <VariableDeleteConfirmation variableKey={variable.key} usages={usages} />
                : `Are you sure you want to delete "${variable.key}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (confirmed) {
            router.delete(`/variables/${variable.id}`);
        }
    }, [confirm]);

    return {
        closeForm,
        closeImport,
        closeUsageInspection,
        deleteVariable,
        editingVariable,
        inspectedUsages,
        inspectedVariable,
        inspectUsages,
        isFormOpen,
        isImportOpen,
        isInspectingUsages,
        openCreate,
        openEdit,
        openImport,
    };
}
