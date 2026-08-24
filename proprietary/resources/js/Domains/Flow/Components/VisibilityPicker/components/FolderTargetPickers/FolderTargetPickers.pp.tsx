import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useTheme } from 'styled-components';
import WorkspaceFolderPicker from '@/Domains/Folder/Components/WorkspaceFolderPicker/WorkspaceFolderPicker';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import type {
    FolderTarget,
    VisibilityPickerValue,
} from '@proprietary/Domains/Flow/Components/VisibilityPicker/types.pp';
import { findFolderName } from '@proprietary/Domains/Flow/Components/VisibilityPicker/utils.pp';
import TeamSelector from '@proprietary/Domains/Flow/Components/VisibilityPicker/components/TeamSelector/TeamSelector.pp';
import * as S from './styled.pp';

interface Props {
    value: VisibilityPickerValue;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees: TeamTree[];
    ownerId?: Id | null;
    ownerChanged: boolean;
    onChange: (value: VisibilityPickerValue) => void;
}

export default function FolderTargetPickers({
    value,
    personalTree,
    workspaceTree,
    teamTrees,
    ownerId = null,
    ownerChanged,
    onChange,
}: Props) {
    const theme = useTheme();
    const [pickerTarget, setPickerTarget] = useState<FolderTarget>(null);
    const [folderNames, setFolderNames] = useState<Record<string, string>>({});
    const {
        visibility,
        personalFolderId,
        wsFolderId,
        teamId,
        teamFolderId,
    } = value;
    const selectedTeam = teamTrees.find((team) => team.id === teamId);

    const personalLabel =
        personalFolderId !== null
            ? findFolderName(personalTree, personalFolderId) ||
              folderNames[personalFolderId] ||
              'Folder'
            : 'Owner (root)';
    const workspaceLabel =
        wsFolderId !== null
            ? findFolderName(workspaceTree, wsFolderId) ||
              folderNames[wsFolderId] ||
              'Folder'
            : 'Workspace (root)';
    const teamFolderLabel = (() => {
        if (!selectedTeam) {
            return '';
        }
        if (teamFolderId !== null) {
            return (
                findFolderName(selectedTeam.tree, teamFolderId) ||
                folderNames[teamFolderId] ||
                `${selectedTeam.name} (root)`
            );
        }
        return `${selectedTeam.name} (root)`;
    })();

    const handlePickerConfirm = (
        folderId: Id | null,
        folderName?: string | null,
    ) => {
        if (folderId !== null && folderName) {
            setFolderNames((current) => ({
                ...current,
                [folderId]: folderName,
            }));
        }

        if (pickerTarget === 'owner') {
            onChange({ ...value, personalFolderId: folderId });
        } else if (pickerTarget === 'workspace') {
            onChange({ ...value, wsFolderId: folderId });
        } else if (pickerTarget === 'team') {
            onChange({ ...value, teamFolderId: folderId });
        }

        setPickerTarget(null);
    };

    return (
        <>
            {visibility === 'owner' && (
                <S.Section>
                    <S.Label>Owner folder</S.Label>
                    {ownerChanged ? (
                        <S.DisabledHint>
                            <Icon
                                icon="lucide:info"
                                width={14}
                                style={{ flexShrink: 0 }}
                            />
                            The flow will be placed at the root of the new
                            owner's personal tree.
                        </S.DisabledHint>
                    ) : (
                        <S.FolderButton
                            type="button"
                            onClick={() => setPickerTarget('owner')}
                        >
                            <Icon
                                icon="lucide:home"
                                width={14}
                                style={{
                                    color: theme.colors.accent.warning,
                                }}
                            />
                            {personalLabel}
                            <S.Chevron
                                icon="lucide:chevron-right"
                                width={12}
                            />
                        </S.FolderButton>
                    )}
                </S.Section>
            )}

            {visibility === 'workspace' && (
                <S.Section>
                    <S.Label>Workspace folder</S.Label>
                    <S.FolderButton
                        type="button"
                        onClick={() => setPickerTarget('workspace')}
                    >
                        <Icon
                            icon="lucide:building-2"
                            width={14}
                            style={{ color: theme.colors.accent.info }}
                        />
                        {workspaceLabel}
                        <S.Chevron
                            icon="lucide:chevron-right"
                            width={12}
                        />
                    </S.FolderButton>
                </S.Section>
            )}

            {visibility === 'team' && (
                <S.Section>
                    <S.Label>Team</S.Label>
                    <TeamSelector
                        teams={teamTrees}
                        selectedTeamId={teamId}
                        onChange={(nextTeamId) =>
                            onChange({
                                ...value,
                                teamId: nextTeamId,
                                teamFolderId: null,
                            })
                        }
                    />

                    {teamId && selectedTeam && (
                        <>
                            <S.TeamFolderLabel>
                                Team folder
                            </S.TeamFolderLabel>
                            <S.FolderButton
                                type="button"
                                onClick={() => setPickerTarget('team')}
                            >
                                <Icon
                                    icon="lucide:folder"
                                    width={14}
                                    style={{
                                        color:
                                            theme.colors.accent.success,
                                    }}
                                />
                                {teamFolderLabel}
                                <S.Chevron
                                    icon="lucide:chevron-right"
                                    width={12}
                                />
                            </S.FolderButton>
                        </>
                    )}
                </S.Section>
            )}

            {pickerTarget === 'owner' && (
                <WorkspaceFolderPicker
                    isOpen
                    onClose={() => setPickerTarget(null)}
                    onConfirm={handlePickerConfirm}
                    workspaceTree={personalTree}
                    title="Choose folder"
                    confirmLabel="Select"
                    rootLabel="Owner"
                    rootIcon="lucide:home"
                    scope="owner"
                    ownerId={ownerId}
                />
            )}
            {pickerTarget === 'workspace' && (
                <WorkspaceFolderPicker
                    isOpen
                    onClose={() => setPickerTarget(null)}
                    onConfirm={handlePickerConfirm}
                    workspaceTree={workspaceTree}
                    title="Choose workspace folder"
                    confirmLabel="Select"
                    rootLabel="Workspace"
                    rootIcon="lucide:building-2"
                    scope="workspace"
                />
            )}
            {pickerTarget === 'team' && selectedTeam && (
                <WorkspaceFolderPicker
                    isOpen
                    onClose={() => setPickerTarget(null)}
                    onConfirm={handlePickerConfirm}
                    workspaceTree={selectedTeam.tree}
                    title={`Choose folder in ${selectedTeam.name}`}
                    confirmLabel="Select"
                    rootLabel={selectedTeam.name}
                    rootIcon="lucide:users"
                    scope="team"
                    rootFolderId={selectedTeam.root_folder_id}
                />
            )}
        </>
    );
}
