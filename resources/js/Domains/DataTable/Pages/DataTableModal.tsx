import { useEffect, useState } from 'react';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import Button from '@/Shared/UI/Button/Button';
import GroupField from '@/Shared/UI/GroupField/GroupField';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import { useAuth } from '@/App/Hooks/usePageProps';
import {
    canEditOwnership,
    OWNERSHIP_DISABLED_HINT,
} from '@/Shared/Utils/ownershipPermissions';
import type { DataTable, DataTablePayload, DataTableScope } from '../types';
import * as S from './styled';

interface Props {
    dataTable: DataTable | null;
    groups: string[];
    isOpen: boolean;
    teams: { id: Id; name: string }[];
    submitting: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: DataTablePayload) => Promise<void>;
}

export default function DataTableModal({
    dataTable,
    groups,
    isOpen,
    teams,
    submitting,
    error,
    onClose,
    onSubmit,
}: Props) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [group, setGroup] = useState('');
    const [scope, setScope] = useState<DataTableScope>('owner');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [ownerId, setOwnerId] = useState<Id | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setName(dataTable?.name ?? '');
        setDescription(dataTable?.description ?? '');
        setGroup(dataTable?.group ?? '');
        setScope(dataTable?.visibility ?? 'owner');
        setTeamId(dataTable?.team_id ?? null);
        setOwnerId(dataTable?.user_id ?? null);
    }, [dataTable, isOpen]);

    const ownershipDisabled = dataTable ? !canEditOwnership({
        currentUserId: user?.id ?? '',
        currentUserWorkspaceRole: user?.workspace_role ?? 'member',
        resourceOwnerId: dataTable.user_id,
        ownerWorkspaceRole: dataTable.owner_workspace_role,
    }) : false;

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return;
        await onSubmit({
            name: name.trim(),
            description: description.trim() || null,
            group: group.trim() || null,
            visibility: scope,
            team_id: scope === 'team' ? teamId : null,
            user_id: ownerId,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={dataTable ? 'Edit Data Table' : 'Create Data Table'}
            width="440px"
        >
            <S.ModalForm onSubmit={submit}>
                <Input
                    autoFocus
                    label="Name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Customer records"
                    maxLength={128}
                    error={error || undefined}
                />
                <S.Field>
                    <S.FieldLabel htmlFor="data-table-description">Description (Optional)</S.FieldLabel>
                    <S.TextArea
                        id="data-table-description"
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        placeholder="What this data table contains"
                        rows={3}
                        maxLength={500}
                    />
                </S.Field>
                <GroupField
                    value={group}
                    groups={groups}
                    isModalOpen={isOpen}
                    onChange={setGroup}
                />
                <ScopePicker
                    label="Visibility"
                    value={{ scope, team_id: teamId }}
                    onChange={value => {
                        setScope(value.scope as DataTableScope);
                        setTeamId(value.team_id);
                    }}
                    teams={teams}
                    ownerLabel="Owner"
                    ownerScope="owner"
                    disabled={ownershipDisabled}
                    disabledHint={OWNERSHIP_DISABLED_HINT}
                />
                <UserPicker
                    label="Owner"
                    value={ownerId}
                    onChange={setOwnerId}
                    placeholder="Myself (default)"
                    disabled={ownershipDisabled}
                />
                <S.ModalActions>
                    <Button size="sm" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button
                        size="sm"
                        type="submit"
                        loading={submitting}
                        disabled={!name.trim() || (scope === 'team' && !teamId)}
                    >
                        {dataTable ? 'Save Changes' : 'Create Data Table'}
                    </Button>
                </S.ModalActions>
            </S.ModalForm>
        </Modal>
    );
}
