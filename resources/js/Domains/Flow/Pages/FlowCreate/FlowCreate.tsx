import React, { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { PageProps } from '@/App/types';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import Input from '@/Shared/UI/Input/Input';
import { TextArea } from '@/Shared/UI/Input/Input';
import Button, { ButtonLink } from '@/Shared/UI/Button/Button';
import VisibilityPicker, { type VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import RepoLinkForm, { type RepoLinkValue } from '@proprietary/Domains/Integration/Components/RepoLinkForm/RepoLinkForm.pp';
import MessageContent from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/MessageContent/MessageContent';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import type { Integration } from '@/Domains/Integration/types';
import {
    compileNodalGraphToCode,
    normalizeNodalGraph,
} from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import * as S from './styled';

interface Props {
    personalTree: FolderTree[];
    defaultOwnerId?: Id | null;
    defaultFolderId: Id | null;
    defaultFolderTeamId: Id | null;
    repositoryIntegrations: Integration[];
    workspaceTree: FolderTree[];
    teamTrees?: TeamTree[];
    view: string | null;
}

type FlowCreationChoice = 'code' | 'repository' | 'nodal';

export default function FlowCreate({ personalTree, defaultOwnerId = null, defaultFolderId, defaultFolderTeamId, repositoryIntegrations, workspaceTree, teamTrees = [], view }: Props) {
    const { currentWorkspace, settings } = usePage<InertiaPageProps & PageProps>().props;
    const isWsView = view === 'workspace';
    const isTeamFolder = !!defaultFolderTeamId;
    const useTeamDefault = isTeamFolder && settings.teams_enabled;
    const useWorkspaceDefault = isWsView
        && !isTeamFolder
        && settings.workspace_sharing_enabled;

    const defaultVisibility = useTeamDefault
        ? 'team' as const
        : useWorkspaceDefault ? 'workspace' as const : 'owner' as const;

    const [pickerValue, setPickerValue] = useState<VisibilityPickerValue>({
        visibility: defaultVisibility,
        personalFolderId: !isWsView && !isTeamFolder ? defaultFolderId : null,
        wsFolderId: useWorkspaceDefault ? defaultFolderId : null,
        teamId: useTeamDefault ? defaultFolderTeamId : null,
        teamFolderId: useTeamDefault ? defaultFolderId : null,
    });

    const [creationChoice, setCreationChoice] = useState<FlowCreationChoice>(
        currentWorkspace?.default_flow_type ?? 'nodal',
    );
    const [repoLink, setRepoLink] = useState<RepoLinkValue>({
        integration_id: null,
        repo_full_name: '',
        branch: '',
        file_path: '',
    });

    const form = useForm({ name: '', description: '' });

    const selectedTeam = teamTrees.find(t => t.id === pickerValue.teamId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { visibility, personalFolderId, wsFolderId, teamId, teamFolderId } = pickerValue;
        const sourceType = creationChoice === 'repository' ? 'repository' : 'code';
        const flowType = creationChoice === 'nodal' ? 'nodal' : 'code';
        const payload: Record<string, unknown> = {
            ...form.data,
            source_type: sourceType,
            flow_type: flowType,
            visibility,
        };
        if (flowType === 'nodal') {
            const graph = currentWorkspace?.default_flow_nodal_graph
                ? normalizeNodalGraph(currentWorkspace.default_flow_nodal_graph)
                : normalizeNodalGraph(null);
            payload.nodal_graph = graph;
            payload.code = compileNodalGraphToCode(graph);
        }

        if (visibility === 'owner') {
            payload.folder_id = personalFolderId;
            if (defaultOwnerId) payload.owner_id = defaultOwnerId;
        } else if (visibility === 'workspace') {
            payload.workspace_folder_id = wsFolderId;
        } else if (visibility === 'team') {
            payload.team_id = teamId;
            payload.workspace_folder_id = teamFolderId ?? selectedTeam?.root_folder_id ?? null;
        }

        if (creationChoice === 'repository' && repoLink.integration_id && repoLink.repo_full_name && repoLink.branch) {
            payload.repo_link = {
                integration_id: repoLink.integration_id,
                repo_full_name: repoLink.repo_full_name,
                branch: repoLink.branch,
                file_path: repoLink.file_path || '',
            };
        }

        router.post('/flows', payload as Record<string, string>, {
            onBefore: () => { form.processing = true; },
            onFinish: () => { form.processing = false; },
            onError: (errors) => { form.setError(errors as Record<string, string>); },
        });
    };

    const hasRepoIntegrations = repositoryIntegrations.length > 0;
    const repositoryPromoted = !settings.vcs_enabled && settings.promote_disabled_features;
    const showRepository = settings.vcs_enabled || repositoryPromoted;
    const repoLinkComplete = !!(repoLink.integration_id && repoLink.repo_full_name && repoLink.branch);
    const canSubmit = !form.processing && (creationChoice !== 'repository' || repoLinkComplete) && (pickerValue.visibility !== 'team' || pickerValue.teamId !== null);

    return (
        <AppLayout title="Create Flow">
            <S.Container>
                <S.TwoColumns onSubmit={handleSubmit}>
                    <S.Column>
                        <S.ColumnHeader>
                            <S.ColumnIcon><Icon icon="lucide:workflow" width={16} /></S.ColumnIcon>
                            <div>
                                <S.ColumnTitle>Flow Details</S.ColumnTitle>
                            </div>
                        </S.ColumnHeader>
                        <S.ColumnDesc>
                            Give your flow a name and organize it in a folder. You can change these settings later.
                        </S.ColumnDesc>

                        <Input
                            label="Flow name"
                            value={form.data.name}
                            onChange={e => form.setData('name', e.target.value)}
                            error={form.errors.name}
                            placeholder="My automation flow"
                            maxLength={128}
                            showCharCount
                            autoFocus
                        />
                        <TextArea
                            label="Description"
                            value={form.data.description}
                            onChange={e => form.setData('description', e.target.value)}
                            error={form.errors.description}
                            placeholder="What does this flow do?"
                        />

                        <VisibilityPicker
                            value={pickerValue}
                            onChange={setPickerValue}
                            personalTree={personalTree}
                            workspaceTree={workspaceTree}
                            teamTrees={teamTrees}
                            ownerId={defaultOwnerId}
                        />
                    </S.Column>

                    <S.Column>
                        <S.ColumnHeader>
                            <S.ColumnIcon><Icon icon="lucide:file-code" width={16} /></S.ColumnIcon>
                            <div>
                                <S.ColumnTitle>Flow Type</S.ColumnTitle>
                            </div>
                        </S.ColumnHeader>
                        <S.ColumnDesc>
                            Choose how this flow starts. Repository flows still run as code, while Visual Builder prepares the nodal editor experience.
                        </S.ColumnDesc>

                        <S.SourceToggle>
                            <S.SourceOption $active={creationChoice === 'nodal'} onClick={() => setCreationChoice('nodal')} type="button">
                                <Icon icon="lucide:workflow" width={14} />
                                Visual Builder
                            </S.SourceOption>
                            <S.SourceOption $active={creationChoice === 'code'} onClick={() => setCreationChoice('code')} type="button">
                                <Icon icon="lucide:code-2" width={14} />
                                Raw Code
                            </S.SourceOption>
                            {showRepository && (
                                <S.SourceOption
                                    $active={creationChoice === 'repository'}
                                    onClick={() => setCreationChoice('repository')}
                                    type="button"
                                    disabled={!settings.vcs_enabled}
                                >
                                    <Icon icon="lucide:git-branch" width={14} />
                                    Git Repository
                                </S.SourceOption>
                            )}
                        </S.SourceToggle>

                        {repositoryPromoted && (
                            <S.SourceHint>
                                <Icon icon="lucide:lock" width={16} />
                                <span><MessageContent message={settings.disabled_feature_message} /></span>
                            </S.SourceHint>
                        )}

                        {creationChoice === 'code' ? (
                            <>
                                <S.SourceHint>
                                    <Icon icon="lucide:code-2" width={16} />
                                    <span>You'll write code directly in the built-in editor after creation.</span>
                                </S.SourceHint>
                                <S.SourceFeatures>
                                    <S.SourceFeature>
                                        <Icon icon="lucide:pencil" width={13} />
                                        <span>Edit code directly in the browser with syntax highlighting</span>
                                    </S.SourceFeature>
                                    <S.SourceFeature>
                                        <Icon icon="lucide:save" width={13} />
                                        <span>Auto-save with instant feedback</span>
                                    </S.SourceFeature>
                                    {settings.vcs_enabled && (
                                        <S.SourceFeature>
                                            <Icon icon="lucide:git-branch" width={13} />
                                            <span>Link a repository later from the flow editor</span>
                                        </S.SourceFeature>
                                    )}
                                </S.SourceFeatures>
                            </>
                        ) : creationChoice === 'nodal' ? (
                            <>
                                <S.SourceHint>
                                    <Icon icon="lucide:workflow" width={16} />
                                    <span>You'll build this flow visually with nodes. Behind the scenes, it will still generate executable JavaScript for runs.</span>
                                </S.SourceHint>
                                <S.SourceFeatures>
                                    <S.SourceFeature>
                                        <Icon icon="lucide:mouse-pointer-2" width={13} />
                                        <span>Add and connect nodes on a canvas instead of writing code by hand</span>
                                    </S.SourceFeature>
                                    <S.SourceFeature>
                                        <Icon icon="lucide:file-json" width={13} />
                                        <span>Store the graph as structured JSON while keeping generated code in the flow</span>
                                    </S.SourceFeature>
                                </S.SourceFeatures>
                            </>
                        ) : hasRepoIntegrations ? (
                            <>
                                <RepoLinkForm
                                    integrations={repositoryIntegrations}
                                    value={repoLink}
                                    onChange={setRepoLink}
                                    compact
                                />
                                <S.SourceFeatures>
                                    <S.SourceFeature>
                                        <Icon icon="lucide:refresh-cw" width={13} />
                                        <span>Code syncs automatically on push or tag</span>
                                    </S.SourceFeature>
                                    <S.SourceFeature>
                                        <Icon icon="lucide:lock" width={13} />
                                        <span>Editor becomes read-only when linked to a repo</span>
                                    </S.SourceFeature>
                                </S.SourceFeatures>
                            </>
                        ) : (
                            <S.SourceHint>
                                <Icon icon="lucide:puzzle" width={16} />
                                <span>
                                    No Git integration found.
                                    <br />
                                    You can link a repository after creation from the flow editor, or set up a GitHub App in Integrations.
                                </span>
                            </S.SourceHint>
                        )}
                    </S.Column>

                    <S.Actions>
                        <Button type="submit" disabled={!canSubmit}>
                            {form.processing ? 'Creating...' : 'Create Flow'}
                        </Button>
                        <ButtonLink variant="ghost" href={view === 'workspace' ? '/flows?view=workspace' : '/flows'} onClick={e => handleLinkClick(e, view === 'workspace' ? '/flows?view=workspace' : '/flows')}>
                            Cancel
                        </ButtonLink>
                    </S.Actions>
                </S.TwoColumns>
            </S.Container>
        </AppLayout>
    );
}
