import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useTheme } from 'styled-components';
import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import VisibilityPicker, { type VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import { canEditOwnership, OWNERSHIP_DISABLED_HINT, ADMIN_TRANSFER_WARNING } from '@/Shared/Utils/ownershipPermissions';
import type { Flow } from '@/Domains/Flow/types';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import type { PageProps } from '@/App/types';
import * as S from './styled';

type VisibilityFlow = Pick<Flow, 'visibility' | 'folder_id' | 'workspace_folder_id' | 'owner_id' | 'team_id' | 'owner_workspace_role'>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: {
        visibility: 'owner' | 'workspace' | 'team';
        folder_id: Id | null;
        workspace_folder_id: Id | null;
        team_id?: Id | null;
        owner_id?: Id | null;
    }) => void;
    flow: VisibilityFlow;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees?: TeamTree[];
    loading?: boolean;
}

export default function VisibilityModal({ isOpen, onClose, onConfirm, flow, personalTree, workspaceTree, teamTrees = [], loading }: Props) {
    const theme = useTheme();
    const { auth } = usePage<InertiaPageProps & PageProps>().props;
    const currentUserId = auth.user?.id ?? '';
    const currentUserWorkspaceRole = auth.user?.workspace_role ?? 'member';
    const { confirm, ConfirmModal } = useConfirm();
    const {
        visibility: flowVisibility,
        folder_id: flowFolderId,
        workspace_folder_id: flowWorkspaceFolderId,
        owner_id: flowOwnerId,
        team_id: flowTeamId,
        owner_workspace_role: flowOwnerWorkspaceRole,
    } = flow;
    const flowRef = useRef(flow);
    flowRef.current = flow;

    const ownershipDisabled = !canEditOwnership({
        currentUserId: currentUserId,
        currentUserWorkspaceRole,
        resourceOwnerId: flowOwnerId,
        ownerWorkspaceRole: flowOwnerWorkspaceRole,
    });

    const [pickerValue, setPickerValue] = useState<VisibilityPickerValue>({
        visibility: flowVisibility,
        personalFolderId: flowFolderId,
        wsFolderId: flowWorkspaceFolderId,
        teamId: flowTeamId ?? null,
        teamFolderId: flowVisibility === 'team' ? flowWorkspaceFolderId : null,
    });
    const [ownerId, setOwnerId] = useState<Id | null>(flowOwnerId);
    const [targetUserRole, setTargetUserRole] = useState<string | undefined>(flowOwnerWorkspaceRole);

    useEffect(() => {
        if (isOpen) {
            const currentFlow = flowRef.current;
            setPickerValue({
                visibility: currentFlow.visibility,
                personalFolderId: currentFlow.folder_id,
                wsFolderId: currentFlow.workspace_folder_id,
                teamId: currentFlow.team_id ?? null,
                teamFolderId: currentFlow.visibility === 'team' ? currentFlow.workspace_folder_id : null,
            });
            setOwnerId(currentFlow.owner_id);
            setTargetUserRole(currentFlow.owner_workspace_role);
        }
    }, [isOpen]);

    const selectedTeam = teamTrees.find(t => t.id === pickerValue.teamId);

    const handleConfirm = async () => {
        const { visibility, personalFolderId, wsFolderId, teamId, teamFolderId } = pickerValue;

        if (ownerId && ownerId !== flow.owner_id && ownerId !== auth.user?.id) {
            let adminTransferWarned = false;
            if (currentUserWorkspaceRole === 'manager' && targetUserRole === 'admin') {
                const ok = await confirm({
                    title: 'Transfer ownership',
                    message: ADMIN_TRANSFER_WARNING,
                    confirmLabel: 'Transfer anyway',
                    variant: 'danger',
                });
                if (!ok) return;
                adminTransferWarned = true;
            }
            if (!adminTransferWarned && visibility === 'owner') {
                const ok = await confirm({
                    title: 'Transfer ownership',
                    message: 'This flow has personal visibility. By transferring it to another user, you will permanently lose access to it.',
                    confirmLabel: 'Transfer anyway',
                    variant: 'danger',
                });
                if (!ok) return;
            }
        }

        const data: Parameters<typeof onConfirm>[0] = {
            visibility,
            folder_id: visibility === 'owner' ? personalFolderId : null,
            workspace_folder_id: visibility === 'workspace' ? wsFolderId
                : visibility === 'team' ? (teamFolderId ?? selectedTeam?.root_folder_id ?? null)
                : null,
        };
        if (visibility === 'team') {
            data.team_id = teamId;
        } else {
            data.team_id = null;
        }
        if (ownerId !== flow.owner_id) {
            data.owner_id = ownerId;
            // The picked folder belongs to the current user's tree; it only
            // remains valid when the flow is transferred to that same user.
            if (visibility === 'owner' && ownerId !== auth.user?.id) {
                data.folder_id = null;
            }
        }
        onConfirm(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Flow Visibility"
            width="460px"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleConfirm} loading={loading} disabled={pickerValue.visibility === 'team' && !pickerValue.teamId}>Save</Button>
                </>
            }
        >
            <S.Content>
                <VisibilityPicker
                    value={pickerValue}
                    onChange={setPickerValue}
                    personalTree={personalTree}
                    workspaceTree={workspaceTree}
                    teamTrees={teamTrees}
                    ownerChanged={ownerId !== null && ownerId !== auth.user?.id}
                    disabled={ownershipDisabled}
                    disabledHint={OWNERSHIP_DISABLED_HINT}
                />

                <S.Separator />

                <S.TransferBanner>
                    <Icon icon="lucide:arrow-right-left" width={16} style={{ color: theme.colors.text.tertiary, flexShrink: 0 }} />
                    <S.TransferText>
                        <S.TransferTitle>Transfer ownership</S.TransferTitle>
                        <S.TransferDesc>Change who owns this flow. The new owner will have full control.</S.TransferDesc>
                    </S.TransferText>
                </S.TransferBanner>
                <S.OwnerRow>
                    <UserPicker
                        value={ownerId}
                        onChange={v => {
                            setOwnerId(v);
                            // Default the personal folder to the new owner's
                            // root; the previous folder belongs to the old
                            // owner and would fail assignment validation.
                            setPickerValue(current => ({
                                ...current,
                                personalFolderId: v === flow.owner_id ? flow.folder_id : null,
                            }));
                        }}
                        onSelect={u => setTargetUserRole(u?.workspace_role ?? undefined)}
                        placeholder="Select owner…"
                        clearable={false}
                        disabled={ownershipDisabled}
                    />
                </S.OwnerRow>
            </S.Content>
            <ConfirmModal />
        </Modal>
    );
}
