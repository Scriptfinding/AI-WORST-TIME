import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import { usePageProps } from '@/App/Hooks/usePageProps';
import FeatureUnavailablePanel from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/FeatureUnavailablePanel';
import type { Workspace, WorkspaceUser } from '@/Domains/Workspace/types';
import MemberListCard from './MemberListCard/MemberListCard';
import TeamsCard from '@proprietary/Domains/Workspace/Pages/WorkspaceMembers/TeamsCard/TeamsCard.pp';
import { SettingsTabsScroller, SettingsTabs, SettingsTab } from '@/Shared/UI/SettingsTabs/styled';
import type { PendingInvitation, RegistrationRequest, Team } from './types';
import { useWorkspaceMembersTab } from './useWorkspaceMembersTab';
import * as S from './styled';

export type { PendingInvitation, RegistrationRequest, Team, TeamUser } from './types';
export { formatDate, menuPositionFromEvent } from './utils';

interface Props {
    workspace: Workspace & { users: WorkspaceUser[] };
    isWorkspaceAdmin: boolean;
    callerWorkspaceRole: 'admin' | 'manager' | 'member';
    pendingInvitations: PendingInvitation[];
    registrationRequests: RegistrationRequest[];
    teams: Team[];
    canCreateTeam: boolean;
}

export default function WorkspaceMembers({
    workspace,
    isWorkspaceAdmin,
    callerWorkspaceRole,
    pendingInvitations,
    registrationRequests,
    teams,
    canCreateTeam,
}: Props) {
    const { settings } = usePageProps();
    const teamsEnabled = settings?.teams_enabled ?? false;
    const { activeTab, handleTabChange } = useWorkspaceMembersTab();

    return (
        <AppLayout title="Workspace Members">
            <SettingsTabsScroller>
                <SettingsTabs>
                    <SettingsTab $active={activeTab === 'users'} onClick={() => handleTabChange('users')}>
                        <Icon icon="lucide:users" width={14} height={14} />
                        Users
                    </SettingsTab>
                    <SettingsTab $active={activeTab === 'teams'} onClick={() => handleTabChange('teams')}>
                        <Icon icon="lucide:users-round" width={14} height={14} />
                        Teams
                    </SettingsTab>
                </SettingsTabs>
            </SettingsTabsScroller>

            <S.Page>
                {activeTab === 'users' && (
                    <MemberListCard
                        workspace={workspace}
                        isWorkspaceAdmin={isWorkspaceAdmin}
                        callerWorkspaceRole={callerWorkspaceRole}
                        teams={teams}
                        pendingInvitations={pendingInvitations}
                        registrationRequests={registrationRequests}
                    />
                )}
                {activeTab === 'teams' && (
                    teamsEnabled
                        ? (
                            <TeamsCard
                                teams={teams}
                                members={workspace.users ?? []}
                                isWorkspaceAdmin={isWorkspaceAdmin}
                                canCreateTeam={canCreateTeam}
                            />
                        )
                        : <FeatureUnavailablePanel message={settings.disabled_feature_message} />
                )}
            </S.Page>
        </AppLayout>
    );
}
