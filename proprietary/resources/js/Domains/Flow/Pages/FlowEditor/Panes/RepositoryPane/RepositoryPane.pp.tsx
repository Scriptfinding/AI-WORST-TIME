import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import RepoLinkForm, { type RepoLinkValue } from '@proprietary/Domains/Integration/Components/RepoLinkForm/RepoLinkForm.pp';
import { useToast } from '@/App/Hooks/useToast';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useSyncedState } from '@/Shared/Hooks/useSyncedState';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import { useQuickRequirementCreation } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import type { Flow } from '@/Domains/Flow/types';
import type { Integration } from '@/Domains/Integration/types';
import * as S from './styled.pp';

interface Props {
    flow: Flow;
    integrations: Integration[];
}

export default function RepositoryPane({ flow, integrations }: Props) {
    const { toast } = useToast();
    const { confirm, ConfirmModal } = useConfirm();
    const quickCreation = useQuickRequirementCreation();
    const link = flow.repository_link;
    const isRepoSource = flow.source_type === 'repository';
    const isNodalFlow = flow.flow_type === 'nodal';
    const [availableIntegrations, setAvailableIntegrations] = useSyncedState(integrations);

    const [repoLink, setRepoLink] = useState<RepoLinkValue>({
        integration_id: link?.integration_id ?? null,
        repo_full_name: link?.repo_full_name ?? '',
        branch: link?.branch ?? '',
        file_path: link?.file_path ?? '',
    });
    const [syncTrigger, setSyncTrigger] = useState<'push' | 'tag'>(link?.sync_trigger ?? 'push');
    const [saving, setSaving] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [creatingIntegration, setCreatingIntegration] = useState(false);

    const handleCreateIntegration = async () => {
        setCreatingIntegration(true);
        try {
            const integration = await quickCreation.create('integration', {
                category: 'repository',
            });
            if (!integration) return;

            if (integration.provider_status === 'connected') {
                setAvailableIntegrations(current => [
                    ...current.filter(item => item.id !== integration.id),
                    integration,
                ]);
                setRepoLink(current => ({
                    ...current,
                    integration_id: integration.id,
                    repo_full_name: '',
                    branch: '',
                }));
            }
            await quickCreation.refresh('integrations');
        } finally {
            setCreatingIntegration(false);
        }
    };

    const handleSave = () => {
        if (!repoLink.integration_id || !repoLink.repo_full_name || !repoLink.branch.trim() || !repoLink.file_path.trim()) return;

        setSaving(true);
        router.post(`/flows/${flow.id}/repository-link`, {
            integration_id: repoLink.integration_id,
            repo_full_name: repoLink.repo_full_name,
            branch: repoLink.branch.trim(),
            file_path: repoLink.file_path.trim(),
            sync_trigger: syncTrigger,
        }, {
            preserveScroll: true,
            onSuccess: () => toast('Repository linked and code synced'),
            onFinish: () => setSaving(false),
        });
    };

    const handleRemoveLink = async () => {
        const repoName = link?.repo_full_name;
        const confirmed = await confirm({
            title: 'Unlink Repository',
            message: repoName
                ? `This will unlink the repository "${repoName}" from this flow. The flow will switch back to ${isNodalFlow ? 'visual flow' : 'raw code'} mode.`
                : `This will remove the repository link from this flow. The flow will switch back to ${isNodalFlow ? 'visual flow' : 'raw code'} mode.`,
            confirmLabel: 'Unlink',
            variant: 'danger',
        });
        if (!confirmed) return;

        setUnlinking(true);
        router.delete(`/flows/${flow.id}/repository-link`, {
            preserveScroll: true,
            onSuccess: () => {
                toast('Repository unlinked');
            },
            onFinish: () => setUnlinking(false),
        });
    };

    const canSave = !!repoLink.integration_id && !!repoLink.repo_full_name && !!repoLink.branch.trim();

    if (availableIntegrations.length === 0 && !link) {
        return (
            <Layout.SidePanelSection>
                <Layout.SidePanelSectionInner>
                    <Layout.SectionTitle>Repository</Layout.SectionTitle>
                    <S.EmptyCopy>
                        <Layout.EmptyText>
                            {isNodalFlow
                                ? 'No repository linked. Link one to keep your flow synchronized with Git.'
                                : 'No repository linked. Link one to keep your flow code synchronized with Git.'}
                        </Layout.EmptyText>
                        <Layout.EmptyText>
                            No repository integrations available.{' '}
                            <S.InlineLink
                                href="/integrations"
                                aria-disabled={creatingIntegration}
                                onClick={event => {
                                    event.preventDefault();
                                    if (!creatingIntegration) void handleCreateIntegration();
                                }}
                            >
                                {creatingIntegration ? 'Creating integration...' : 'Create a repository integration'}
                            </S.InlineLink>{' '}
                            first.
                        </Layout.EmptyText>
                    </S.EmptyCopy>
                </Layout.SidePanelSectionInner>
            </Layout.SidePanelSection>
        );
    }

    return (
        <Layout.SidePanelSection style={{ paddingTop: 0 }}>
            <Layout.StickyHeader>
                <Layout.StickyHeaderTitle>Repository</Layout.StickyHeaderTitle>
                <S.SourceBadge $repo={isRepoSource}>
                    <Icon
                        icon={isRepoSource
                            ? 'lucide:git-branch'
                            : isNodalFlow ? 'lucide:workflow' : 'lucide:code-2'}
                        width={12}
                    />
                    {isRepoSource ? 'Git Repository' : isNodalFlow ? 'Visual Flow' : 'Raw Code'}
                </S.SourceBadge>
            </Layout.StickyHeader>
            <Layout.SidePanelSectionInner>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {link && (
                        <S.LinkedBanner $active>
                            <S.LinkedBannerIcon><Icon icon="lucide:link" width={16} /></S.LinkedBannerIcon>
                            <div>
                                Linked to <strong>{link.repo_full_name}</strong> ({link.branch})
                                {link.last_synced_at && (
                                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>
                                        Last synced: {formatDateTime(link.last_synced_at)}
                                    </div>
                                )}
                            </div>
                        </S.LinkedBanner>
                    )}

                    <RepoLinkForm
                        integrations={availableIntegrations}
                        value={repoLink}
                        onChange={setRepoLink}
                    />

                    {availableIntegrations.length > 0 && canSave && !!repoLink.file_path.trim() && (
                        <>
                            <S.FieldGroup>
                                <S.FieldLabel>Sync On</S.FieldLabel>
                                <S.SyncToggle>
                                    <S.SyncOption $active={syncTrigger === 'push'} onClick={() => setSyncTrigger('push')} type="button">
                                        <Icon icon="lucide:arrow-up-circle" width={13} />
                                        On Push
                                    </S.SyncOption>
                                    <S.SyncOption $active={syncTrigger === 'tag'} onClick={() => setSyncTrigger('tag')} type="button">
                                        <Icon icon="lucide:tag" width={13} />
                                        On Tag
                                    </S.SyncOption>
                                </S.SyncToggle>
                                <S.FieldHint>
                                    {syncTrigger === 'push'
                                        ? 'Code will sync whenever a push is made to the tracked branch.'
                                        : 'Code will sync only when a new tag is created.'}
                                </S.FieldHint>
                            </S.FieldGroup>

                            <S.FormActions>
                                {(link || isRepoSource) && (
                                    <Button type="button" variant="danger" size="sm" onClick={handleRemoveLink} loading={unlinking} disabled={unlinking} style={{ marginRight: 'auto' }}>
                                        <Icon icon="lucide:unlink" width={13} />
                                        Unlink
                                    </Button>
                                )}
                                {canSave && (
                                    <Button size="sm" loading={saving} disabled={saving} onClick={handleSave}>
                                        <Icon icon={link ? 'lucide:save' : 'lucide:arrow-down-circle'} width={13} />
                                        {link ? 'Save Settings' : 'Sync Code'}
                                    </Button>
                                )}
                            </S.FormActions>
                        </>
                    )}
                </div>
            </Layout.SidePanelSectionInner>
            <ConfirmModal />
        </Layout.SidePanelSection>
    );
}
