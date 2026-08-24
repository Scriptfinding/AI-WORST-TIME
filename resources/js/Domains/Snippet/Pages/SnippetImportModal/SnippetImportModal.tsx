import React, { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import { useResetOnOpen } from '@/Shared/Hooks/useResetOnOpen';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { Snippet, SnippetType } from '@/Domains/Snippet/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { compileNodalGraphToSnippetCode, normalizeNodalFunctionGraph } from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import SnippetImportFields from './components/SnippetImportFields/SnippetImportFields';
import SourceInput from './components/SourceInput/SourceInput';
import SourcePreview from './components/SourcePreview/SourcePreview';
import * as S from './styled';
import {
    baseNameFromFile,
    labelFromCode,
    parseSnippetSource,
    titleFromBaseName,
} from './utils';

interface SnippetImportPayload {
    label: string;
    description: string | null;
    group: string | null;
    args: string;
    code: string;
    snippet_type: SnippetType;
    nodal_graph: NodalGraph | null;
    scope: IntegrationScope;
    team_id: Id | null;
    is_active: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    groups: string[];
    teams: { id: Id; name: string }[];
    onImport: (payload: SnippetImportPayload) => Promise<Snippet>;
}

export default function SnippetImportModal({ isOpen, onClose, groups, teams, onImport }: Props) {
    const [code, setCode] = useState('');
    const [sourcePreview, setSourcePreview] = useState('');
    const [snippetType, setSnippetType] = useState<SnippetType>('code');
    const [nodalGraph, setNodalGraph] = useState<NodalGraph | null>(null);
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [group, setGroup] = useState('');
    const [args, setArgs] = useState('');
    const [scope, setScope] = useState<IntegrationScope>('owner');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useResetOnOpen(isOpen, () => {
        setCode('');
        setSourcePreview('');
        setSnippetType('code');
        setNodalGraph(null);
        setLabel('');
        setDescription('');
        setGroup('');
        setArgs('');
        setScope('owner');
        setTeamId(null);
        setFileName(null);
        setDragging(false);
        setSubmitting(false);
        setSubmitError(null);
    });

    const readFile = async (file: File) => {
        try {
            const content = await file.text();
            const parsed = parseSnippetSource(content, file.name);
            const metadata = parsed.metadata;
            const baseName = baseNameFromFile(file.name);
            const fallbackLabel = titleFromBaseName(baseName);
            const normalizedGraph = parsed.nodalGraph ? normalizeNodalFunctionGraph(parsed.nodalGraph) : null;
            const parsedArgs = metadata.args || '';
            const compiledCode = normalizedGraph
                ? compileNodalGraphToSnippetCode(normalizedGraph, parsedArgs)
                : parsed.code;

            setFileName(file.name);
            setSourcePreview(parsed.snippetType === 'nodal'
                ? `${JSON.stringify(JSON.parse(content), null, 2)}\n`
                : parsed.code);
            setSnippetType(parsed.snippetType);
            setNodalGraph(normalizedGraph);
            setCode(compiledCode);
            setLabel(metadata.title || labelFromCode(content, fallbackLabel));
            setDescription(metadata.description || '');
            setArgs(parsedArgs);
            setSubmitError(null);
        } catch (error) {
            setFileName(null);
            setCode('');
            setSourcePreview('');
            setSnippetType('code');
            setNodalGraph(null);
            setSubmitError(error instanceof Error ? error.message : 'Unable to read the selected snippet.');
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitError(null);

        if (!fileName) {
            setSubmitError('Drop a JavaScript or JSON snippet file before importing.');
            return;
        }
        if (!label.trim()) {
            setSubmitError('Label is required.');
            return;
        }
        if (scope === 'team' && !teamId) {
            setSubmitError('Select a team for team visibility.');
            return;
        }

        setSubmitting(true);
        try {
            await onImport({
                label: label.trim(),
                description: description.trim() || null,
                group: group.trim() || null,
                args: args.trim(),
                code: nodalGraph ? compileNodalGraphToSnippetCode(nodalGraph, args) : code,
                snippet_type: snippetType,
                nodal_graph: nodalGraph,
                scope,
                team_id: scope === 'team' ? teamId : null,
                is_active: true,
            });
            onClose();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Import failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Snippets" width="680px">
            <S.ImportForm onSubmit={handleSubmit}>
                <SourceInput
                    fileName={fileName}
                    dragging={dragging}
                    hasError={!!submitError && !fileName}
                    onFile={readFile}
                    onDraggingChange={setDragging}
                />

                {fileName && (
                    <>
                        <SnippetImportFields
                            label={label}
                            args={args}
                            group={group}
                            description={description}
                            scope={scope}
                            teamId={teamId}
                            groups={groups}
                            teams={teams}
                            onLabelChange={setLabel}
                            onArgsChange={setArgs}
                            onGroupChange={setGroup}
                            onDescriptionChange={setDescription}
                            onScopeChange={(nextScope, nextTeamId) => {
                                setScope(nextScope);
                                setTeamId(nextTeamId);
                            }}
                        />
                        <SourcePreview code={sourcePreview} snippetType={snippetType} />
                    </>
                )}

                {submitError && (
                    <S.Status $error>
                        <Icon icon="lucide:alert-triangle" width={14} />
                        {submitError}
                    </S.Status>
                )}

                <S.Footer>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={submitting} disabled={!fileName || !label.trim()}>
                        Import
                    </Button>
                </S.Footer>
            </S.ImportForm>
        </Modal>
    );
}
