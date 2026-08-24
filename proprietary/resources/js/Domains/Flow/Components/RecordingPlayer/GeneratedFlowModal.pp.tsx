import { useEffect, useState } from 'react';
import Button from '@/Shared/UI/Button/Button';
import Input, { TextArea } from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import VisibilityPicker, { type VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import type { GeneratedAiControlFlow } from '@/Domains/Flow/Utils/aiControlGraph';
import * as S from './GeneratedFlowModal.styled.pp';

interface Props {
    flow: GeneratedAiControlFlow | null;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees: TeamTree[];
    onClose: () => void;
}

const initialVisibility = (): VisibilityPickerValue => ({
    visibility: 'owner',
    personalFolderId: null,
    wsFolderId: null,
    teamId: null,
    teamFolderId: null,
});

export default function GeneratedFlowModal({
    flow,
    personalTree,
    workspaceTree,
    teamTrees,
    onClose,
}: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<VisibilityPickerValue>(initialVisibility);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!flow) return;
        setName(flow.title);
        setDescription(flow.description);
        setVisibility(initialVisibility());
        setSubmitting(false);
        setError(null);
    }, [flow]);

    const submit = async () => {
        if (!flow || !name.trim()) return;
        if (visibility.visibility === 'team' && !visibility.teamId) {
            setError('Select a team before creating the flow.');
            return;
        }
        const newTab = window.open('', '_blank');
        if (!newTab) {
            setError('Allow pop-ups to create and open the flow in a new tab.');
            return;
        }
        newTab.opener = null;

        const selectedTeam = teamTrees.find(team => team.id === visibility.teamId);
        const payload: Record<string, unknown> = {
            name: name.trim(),
            description: description.trim() || null,
            source_type: 'code',
            flow_type: 'nodal',
            code: flow.code,
            nodal_graph: flow.graph,
            visibility: visibility.visibility,
        };
        if (visibility.visibility === 'owner') {
            payload.folder_id = visibility.personalFolderId;
        } else if (visibility.visibility === 'workspace') {
            payload.workspace_folder_id = visibility.wsFolderId;
        } else {
            payload.team_id = visibility.teamId;
            payload.workspace_folder_id = visibility.teamFolderId ?? selectedTeam?.root_folder_id ?? null;
        }

        setSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/flows', {
                method: 'POST',
                headers: {
                    ...csrfHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'same-origin',
                redirect: 'follow',
            });
            if (!response.ok) {
                const result = await response.json().catch(() => null) as {
                    message?: string;
                    errors?: Record<string, string[]>;
                } | null;
                const validationError = result?.errors
                    ? Object.values(result.errors).flat()[0]
                    : null;
                throw new Error(validationError || result?.message || 'Unable to create the flow.');
            }

            newTab.location.replace(response.url);
            onClose();
        } catch (caught) {
            newTab.close();
            setError(caught instanceof Error ? caught.message : 'Unable to create the flow.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={!!flow}
            onClose={onClose}
            title="Create flow from AI Control"
            caption="Review the generated sequence before opening it as a visual flow."
            width="720px"
            footer={(
                <S.Footer>
                    <Button type="button" variant="secondary" disabled={submitting} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        loading={submitting}
                        disabled={submitting || !name.trim() || (visibility.visibility === 'team' && !visibility.teamId)}
                        onClick={submit}
                    >
                        Create &amp; Open
                    </Button>
                </S.Footer>
            )}
        >
            <S.Body onSubmit={event => { event.preventDefault(); void submit(); }}>
                <Input
                    label="Flow name"
                    value={name}
                    maxLength={128}
                    showCharCount
                    onChange={event => setName(event.target.value)}
                />
                <TextArea
                    label="Description"
                    value={description}
                    placeholder="What does this generated flow do?"
                    onChange={event => setDescription(event.target.value)}
                />
                <S.Section>
                    <S.SectionTitle>Visibility and folder</S.SectionTitle>
                    <VisibilityPicker
                        value={visibility}
                        onChange={setVisibility}
                        personalTree={personalTree}
                        workspaceTree={workspaceTree}
                        teamTrees={teamTrees}
                    />
                </S.Section>
                {error && <S.Error>{error}</S.Error>}
            </S.Body>
        </Modal>
    );
}
