import { usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { PageProps } from '@/App/types';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { VariableSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import OwnershipScope from './components/OwnershipScope/OwnershipScope';
import TypeProviderSelection from './components/TypeProviderSelection/TypeProviderSelection';
import ValueEditor from './components/ValueEditor/ValueEditor';
import GroupCombobox from './GroupCombobox';
import { useVariableForm } from './useVariableForm';
import * as S from './QuickCreateVariableModal.styled';

interface QuickCreateVariableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (variable: VariableSuggestion) => void;
}

export default function QuickCreateVariableModal({
    isOpen,
    onClose,
    onCreated,
}: QuickCreateVariableModalProps) {
    const page = usePage<InertiaPageProps & PageProps & Partial<FlowEditorProps>>().props;
    const { confirm, ConfirmModal } = useConfirm();
    const variableForm = useVariableForm({
        editing: null,
        isOpen,
        onClose,
        confirm,
        onCreated,
    });
    const { form } = variableForm;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Quick create variable"
                caption="Create and insert a variable without leaving the flow editor."
                width="480px"
                zIndex={1050}
                modalKind="variable-quick-create"
            >
                <S.Form onSubmit={variableForm.handleSubmit}>
                    <Input
                        label="Label"
                        value={form.data.key}
                        onChange={event => form.setData('key', event.target.value)}
                        error={form.errors.key}
                        placeholder="My variable"
                        autoComplete="off"
                    />
                    <TypeProviderSelection
                        data={form.data}
                        error={form.errors.type}
                        editing={null}
                        integrations={variableForm.vaultIntegrations}
                        isOpen={isOpen}
                        onTypeChange={variableForm.handleTypeChange}
                        onVaultChange={variableForm.handleVaultChange}
                    />
                    <ValueEditor
                        type={form.data.type}
                        value={form.data.value}
                        error={form.errors.value}
                        onChange={value => form.setData('value', value)}
                    />
                    <GroupCombobox
                        value={form.data.group}
                        onChange={value => form.setData('group', value)}
                        groups={page.variableGroups ?? []}
                    />
                    <OwnershipScope
                        scope={form.data.scope}
                        teamId={variableForm.teamId}
                        teams={page.teams ?? []}
                        ownerId={variableForm.ownerId}
                        disabled={variableForm.ownershipDisabled}
                        onScopeChange={(scope, teamId) => {
                            form.setData('scope', scope);
                            variableForm.setTeamId(teamId);
                        }}
                        onOwnerChange={variableForm.setOwnerId}
                        onOwnerRoleChange={variableForm.setTargetUserRole}
                    />
                    <S.Actions>
                        <Button type="button" variant="secondary" onClick={onClose} disabled={variableForm.submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={variableForm.submitting}>
                            Create and insert
                        </Button>
                    </S.Actions>
                </S.Form>
            </Modal>
            <ConfirmModal />
        </>
    );
}
