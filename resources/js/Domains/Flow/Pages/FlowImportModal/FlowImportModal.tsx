import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import type { VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import { useResetOnOpen } from '@/Shared/Hooks/useResetOnOpen';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import FlowPreview from './components/FlowPreview/FlowPreview';
import ImportError from './components/ImportError/ImportError';
import ImportTargetFields from './components/ImportTargetFields/ImportTargetFields';
import SourceFileInput from './components/SourceFileInput/SourceFileInput';
import * as S from './styled';
import {
    baseNameFromFile,
    buildInitialVisibility,
    labelFromCode,
    metadataFromCode,
    metadataFromJson,
    parseFlowFile,
    titleFromBaseName,
    type ParsedFlowFile,
} from './utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    personalTree?: FolderTree[];
    workspaceTree?: FolderTree[];
    teamTrees?: TeamTree[];
    defaultVisibility?: VisibilityPickerValue['visibility'];
    defaultFolderId?: Id | null;
    defaultTeamId?: Id | null;
}

export default function FlowImportModal({
    isOpen,
    onClose,
    personalTree = [],
    workspaceTree = [],
    teamTrees = [],
    defaultVisibility = 'owner',
    defaultFolderId = null,
    defaultTeamId = null,
}: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [defaultInputs, setDefaultInputs] = useState<Record<string, unknown> | null>(null);
    const [parsedFile, setParsedFile] = useState<ParsedFlowFile | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [visibility, setVisibility] = useState<VisibilityPickerValue>(() => buildInitialVisibility(defaultVisibility, defaultFolderId, defaultTeamId));
    const [dragging, setDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useResetOnOpen(isOpen, () => {
        setName('');
        setDescription('');
        setDefaultInputs(null);
        setParsedFile(null);
        setFileName(null);
        setVisibility(buildInitialVisibility(defaultVisibility, defaultFolderId, defaultTeamId));
        setDragging(false);
        setSubmitting(false);
        setSubmitError(null);
    });

    const readFile = async (file: File) => {
        try {
            const content = await file.text();
            const parsed = parseFlowFile(content, file.name);
            const baseName = baseNameFromFile(file.name);
            const fallbackName = titleFromBaseName(baseName);
            const metadata = parsed.flowType === 'code' ? metadataFromCode(content) : metadataFromJson(content);

            setFileName(file.name);
            setParsedFile(parsed);
            setName(metadata.title || (parsed.flowType === 'code' ? labelFromCode(content, fallbackName) : fallbackName));
            setDescription(metadata.description || '');
            setDefaultInputs(metadata.defaultInputs ?? null);
            setSubmitError(null);
        } catch (error) {
            setFileName(file.name);
            setParsedFile(null);
            setSubmitError(error instanceof Error ? error.message : 'Unable to read this flow file.');
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitError(null);

        if (!parsedFile) {
            setSubmitError('Drop a JavaScript or JSON flow file before importing.');
            return;
        }

        if (!name.trim()) {
            setSubmitError('Flow name is required.');
            return;
        }

        if (visibility.visibility === 'team' && !visibility.teamId) {
            setSubmitError('Select a team for team visibility.');
            return;
        }

        const payload: Record<string, FormDataConvertible> = {
            name: name.trim(),
            description: description.trim() || null,
            visibility: visibility.visibility,
            source_type: 'code',
            flow_type: parsedFile.flowType,
            code: parsedFile.code,
            default_inputs: defaultInputs as FormDataConvertible,
        };

        if (parsedFile.flowType === 'nodal') {
            payload.nodal_graph = parsedFile.nodalGraph;
        }

        if (visibility.visibility === 'owner') {
            payload.folder_id = visibility.personalFolderId;
        } else if (visibility.visibility === 'workspace') {
            payload.workspace_folder_id = visibility.wsFolderId;
        } else {
            payload.team_id = visibility.teamId;
            payload.workspace_folder_id = visibility.teamFolderId
                ?? teamTrees.find(team => team.id === visibility.teamId)?.root_folder_id
                ?? null;
        }

        setSubmitting(true);
        router.post('/flows', payload, {
            onError: errors => {
                setSubmitError(Object.values(errors)[0] || 'Import failed.');
            },
            onSuccess: () => {
                onClose();
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Flow" width="720px">
            <S.ImportForm onSubmit={handleSubmit}>
                <SourceFileInput
                    fileName={fileName}
                    dragging={dragging}
                    hasError={!!submitError && !parsedFile}
                    onDraggingChange={setDragging}
                    onFile={readFile}
                />

                {parsedFile && (
                    <>
                        <ImportTargetFields
                            name={name}
                            description={description}
                            parsedFile={parsedFile}
                            visibility={visibility}
                            personalTree={personalTree}
                            workspaceTree={workspaceTree}
                            teamTrees={teamTrees}
                            onNameChange={setName}
                            onDescriptionChange={setDescription}
                            onVisibilityChange={setVisibility}
                        />
                        <FlowPreview parsedFile={parsedFile} />
                    </>
                )}

                {submitError && <ImportError message={submitError} />}

                <S.Footer>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={submitting} disabled={!parsedFile || !name.trim()}>
                        Import
                    </Button>
                </S.Footer>
            </S.ImportForm>
        </Modal>
    );
}
