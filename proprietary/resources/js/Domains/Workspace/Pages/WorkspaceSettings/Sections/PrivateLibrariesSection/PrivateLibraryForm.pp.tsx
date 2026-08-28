import type { FormEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import GroupCombobox from '@/Domains/Variable/Pages/VariableFormModal/GroupCombobox';
import type { PrivateLibraryFormValues, TeamOption } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/types.pp';
import * as S from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/PrivateLibraryForm.styled.pp';

interface Props {
    isOpen: boolean;
    editing?: boolean;
    values: PrivateLibraryFormValues;
    groups: string[];
    teams: TeamOption[];
    saving: boolean;
    error: string | null;
    onClose: () => void;
    onChange: <K extends keyof PrivateLibraryFormValues>(key: K, value: PrivateLibraryFormValues[K]) => void;
    onSubmit: () => void;
}

export default function PrivateLibraryForm({
    isOpen,
    editing = false,
    values,
    groups,
    teams,
    saving,
    error,
    onClose,
    onChange,
    onSubmit,
}: Props) {
    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? 'Edit private library' : 'Add private library'}
            caption={editing
                ? 'Update this private library and its repository settings.'
                : 'Add a GitHub repository that follows the Puppetflow library structure.'}
            width="560px"
        >
            <S.Form onSubmit={handleSubmit}>
                <S.Layout>
                    <S.Fields>
                        <Input
                            label="Label"
                            value={values.label}
                            onChange={event => onChange('label', event.target.value)}
                            placeholder="Internal automations"
                            required
                        />
                        <Input
                            label="GitHub URL"
                            value={values.url}
                            onChange={event => onChange('url', event.target.value)}
                            placeholder="https://github.com/acme/puppetflow-library"
                            required
                        />
                    </S.Fields>
                    <S.Fields>
                        <Input
                            label="Branch"
                            value={values.branch}
                            onChange={event => onChange('branch', event.target.value)}
                            placeholder="main"
                            required
                        />
                        <GroupCombobox value={values.group} onChange={value => onChange('group', value)} groups={groups} />
                        <ScopePicker
                            label="Visibility"
                            value={{ scope: values.visibility, team_id: values.team_id }}
                            teams={teams}
                            ownerLabel="Owner"
                            ownerScope="owner"
                            onChange={value => {
                                onChange('visibility', value.scope as PrivateLibraryFormValues['visibility']);
                                onChange('team_id', value.team_id);
                            }}
                        />
                        <UserPicker
                            label="Owner"
                            value={values.user_id}
                            onChange={value => onChange('user_id', value)}
                            placeholder="Current user"
                        />
                    </S.Fields>
                </S.Layout>
                {error && <S.ErrorBox>{error}</S.ErrorBox>}
                <S.Actions>
                    <Button
                        type="submit"
                        size="sm"
                        loading={saving}
                        disabled={!values.label.trim() || !values.url.trim() || !values.branch.trim()}
                    >
                        <Icon icon={editing ? 'lucide:save' : 'lucide:plus'} width={14} />
                        {editing ? 'Save library' : 'Add library'}
                    </Button>
                </S.Actions>
            </S.Form>
        </Modal>
    );
}
