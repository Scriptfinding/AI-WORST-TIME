import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { UserVariable } from '@/Domains/Variable/types';
import OwnershipScope from './components/OwnershipScope/OwnershipScope';
import TypeProviderSelection from './components/TypeProviderSelection/TypeProviderSelection';
import ValueEditor from './components/ValueEditor/ValueEditor';
import GroupCombobox from './GroupCombobox';
import type { ConfirmVariableAction } from './types';
import { useVariableForm } from './useVariableForm';
import * as S from './styled';

interface VariableFormModalProps {
    editing: UserVariable | null;
    groups: string[];
    teams: ScopeTeam[];
    isWorkspaceAdmin: boolean;
    isOpen: boolean;
    onClose: () => void;
    confirm: ConfirmVariableAction;
}

export default function VariableFormModal({
    editing,
    groups,
    teams,
    isOpen,
    onClose,
    confirm,
}: VariableFormModalProps) {
    const variableForm = useVariableForm({ editing, isOpen, onClose, confirm });
    const { form } = variableForm;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? 'Edit Variable' : 'New Variable'}
            width="480px"
        >
            <S.ModalForm onSubmit={variableForm.handleSubmit}>
                <Input
                    label="Label"
                    value={form.data.key}
                    onChange={e => form.setData('key', e.target.value)}
                    error={form.errors.key}
                    placeholder="My variable"
                    autoFocus
                />
                <TypeProviderSelection
                    data={form.data}
                    error={form.errors.type}
                    editing={editing}
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
                    groups={groups}
                />
                <OwnershipScope
                    scope={form.data.scope}
                    teamId={variableForm.teamId}
                    teams={teams}
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
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Saving...' : editing ? 'Update' : 'Create'}
                    </Button>
                </S.Actions>
            </S.ModalForm>
        </Modal>
    );
}
