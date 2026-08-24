import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Modal from '@/Shared/UI/Modal/Modal';
import { TextArea } from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import type { LibraryCollection, LibraryStoreChild, LibraryStoreItem, LibraryTeamOption, LibraryUseFormData } from '@/Domains/Library/Components/LibraryStoreModal/types';
import FlowFields from './components/FlowFields/FlowFields';
import SnippetFields from './components/SnippetFields/SnippetFields';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    blueprint: LibraryStoreItem;
    collection: LibraryCollection;
    child: LibraryStoreChild;
    teams: LibraryTeamOption[];
    submitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (data: LibraryUseFormData) => void;
}

export default function LibraryUseItemModal({
    isOpen,
    blueprint,
    collection,
    child,
    teams,
    submitting,
    error,
    onClose,
    onSubmit,
}: Props) {
    const isFlow = collection === 'flows';
    const initial = useMemo<LibraryUseFormData>(() => ({
        name: child.label,
        label: child.label,
        description: child.description || blueprint.description || '',
        group: blueprint.category || '',
        scope: 'owner',
        team_id: null,
        owner_id: null,
    }), [blueprint.category, blueprint.description, child.description, child.label]);

    const [form, setForm] = useState<LibraryUseFormData>(initial);

    useEffect(() => {
        if (isOpen) setForm(initial);
    }, [initial, isOpen]);

    const update = <K extends keyof LibraryUseFormData>(key: K, value: LibraryUseFormData[K]) => {
        setForm(current => ({ ...current, [key]: value }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(form);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={child.label}
            caption={`Configure this ${isFlow ? 'flow' : 'snippet'} before importing it into this workspace.`}
            width="720px"
        >
            <S.Form onSubmit={handleSubmit}>
                {isFlow ? (
                    <FlowFields
                        name={form.name}
                        onNameChange={value => update('name', value)}
                    />
                ) : (
                    <SnippetFields
                        label={form.label}
                        group={form.group}
                        onLabelChange={value => update('label', value)}
                        onGroupChange={value => update('group', value)}
                    />
                )}

                <TextArea
                    label="Description"
                    value={form.description}
                    onChange={event => update('description', event.target.value)}
                    placeholder={isFlow ? 'What does this flow do?' : 'What does this snippet do?'}
                    rows={3}
                />

                <S.DestinationFields>
                    <ScopePicker
                        label="Visibility"
                        value={{ scope: form.scope, team_id: form.team_id }}
                        teams={teams}
                        ownerLabel={isFlow ? 'Owner' : 'Personal'}
                        ownerScope="owner"
                        onChange={value => setForm(current => ({
                            ...current,
                            scope: value.scope as LibraryUseFormData['scope'],
                            team_id: value.team_id,
                        }))}
                    />
                    <UserPicker
                        label="Owner"
                        value={form.owner_id}
                        onChange={value => update('owner_id', value)}
                        placeholder="Myself (default)"
                    />
                </S.DestinationFields>

                {error && <S.ErrorBox>{error}</S.ErrorBox>}

                <S.Footer>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="secondary"
                        loading={submitting}
                        disabled={isFlow ? !form.name.trim() : !form.label.trim()}
                    >
                        <Icon icon="lucide:download" width={14} />
                        Use
                    </Button>
                </S.Footer>
            </S.Form>
        </Modal>
    );
}
