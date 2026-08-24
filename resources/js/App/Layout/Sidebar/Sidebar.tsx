import { useState, type MouseEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useAuth, useCurrentWorkspace, usePageProps } from '@/App/Hooks/usePageProps';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import AccountThemeMenu from './components/AccountThemeMenu/AccountThemeMenu';
import CreateWorkspaceModal from './components/CreateWorkspaceModal/CreateWorkspaceModal';
import NavigationGroups from './components/NavigationGroups/NavigationGroups';
import WorkspaceSelector from './components/WorkspaceSelector/WorkspaceSelector';
import { useSidebarCollapsed } from './hooks/useSidebarCollapsed';
import * as S from './styled';

interface SidebarProps {
    mobileOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
    const { user } = useAuth();
    const workspace = useCurrentWorkspace();
    const { settings, branding, workspace_quota: workspaceQuota, workspaces: rawWorkspaces } = usePageProps();
    const workspaces = Array.isArray(rawWorkspaces) ? rawWorkspaces : [];
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showWorkspaceQuotaModal, setShowWorkspaceQuotaModal] = useState(false);
    const { collapsed, toggleCollapsed } = useSidebarCollapsed();

    if (!user) return null;

    const currentPath = window.location.pathname;
    const isAdmin = user.role === 'admin';
    const canCreateWorkspace = isAdmin || user.can_create_workspace;
    const canSwitchWorkspace = isAdmin || canCreateWorkspace || workspaces.length > 1;
    const handleCreateWorkspace = () => {
        if (workspaceQuota?.exceeded) {
            setShowWorkspaceQuotaModal(true);
            return;
        }

        setShowCreateModal(true);
    };
    const navigate = (event: MouseEvent, url: string) => {
        onClose?.();
        handleLinkClick(event, url);
    };

    return (
        <S.Container $mobileOpen={mobileOpen} $collapsed={collapsed}>
            <S.Brand>
                <S.BrandLink $collapsed={collapsed} href="/" onClick={event => navigate(event, '/')}>
                    <S.BrandIcon src={branding.logo_url} alt={branding.name} />
                    <S.BrandName $collapsed={collapsed}>{branding.name}</S.BrandName>
                </S.BrandLink>
                <S.CollapseButton
                    $collapsed={collapsed}
                    onClick={toggleCollapsed}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <Icon
                        icon={collapsed ? 'lucide:chevron-right' : 'lucide:panel-left-close'}
                        width={16}
                        height={16}
                    />
                </S.CollapseButton>
                <S.MobileCloseButton onClick={onClose}>
                    <Icon icon="lucide:x" />
                </S.MobileCloseButton>
            </S.Brand>

            <WorkspaceSelector
                workspace={workspace}
                workspaces={workspaces}
                currentPath={currentPath}
                collapsed={collapsed}
                isAdmin={isAdmin}
                canCreateWorkspace={canCreateWorkspace}
                canSwitchWorkspace={canSwitchWorkspace}
                onCreateWorkspace={handleCreateWorkspace}
            />
            <NavigationGroups
                settings={settings}
                currentPath={currentPath}
                collapsed={collapsed}
                isAdmin={isAdmin}
                onNavigate={navigate}
            />
            <AccountThemeMenu
                user={user}
                collapsed={collapsed}
                onNavigate={navigate}
                onClose={onClose}
            />
            {canCreateWorkspace && (
                <CreateWorkspaceModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
            {workspaceQuota && (
                <Modal
                    isOpen={showWorkspaceQuotaModal}
                    onClose={() => setShowWorkspaceQuotaModal(false)}
                    title="Workspace limit reached"
                    footer={
                        <Button size="sm" onClick={() => setShowWorkspaceQuotaModal(false)}>
                            Got it
                        </Button>
                    }
                >
                    This instance already has {workspaceQuota.used} workspace
                    {workspaceQuota.used === 1 ? '' : 's'}, which is the current maximum allowed ({workspaceQuota.limit}).
                    Delete an existing workspace or increase the workspace limit to create another one.
                </Modal>
            )}
        </S.Container>
    );
}
