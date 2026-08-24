import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import WorkspaceIcon from '@/Domains/Workspace/Components/WorkspaceIcon/WorkspaceIcon';
import type { PageProps } from '@/App/types';
import type { Workspace } from '@/Domains/Workspace/types';
import { useDismissOnPointerDownOutside } from '@/App/Layout/Sidebar/hooks/useDismissOnPointerDownOutside';
import * as S from './styled';

type WorkspaceOption = PageProps['workspaces'][number];

interface WorkspaceSelectorProps {
    workspace: Workspace | null;
    workspaces: WorkspaceOption[];
    currentPath: string;
    collapsed: boolean;
    isAdmin: boolean;
    canCreateWorkspace: boolean;
    canSwitchWorkspace: boolean;
    onCreateWorkspace: () => void;
}

export default function WorkspaceSelector({
    workspace,
    workspaces,
    currentPath,
    collapsed,
    isAdmin,
    canCreateWorkspace,
    canSwitchWorkspace,
    onCreateWorkspace,
}: WorkspaceSelectorProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useDismissOnPointerDownOutside(wrapperRef, open, () => setOpen(false));

    return (
        <S.Wrapper ref={wrapperRef} $collapsed={collapsed}>
            <S.Select
                onClick={canSwitchWorkspace ? () => setOpen(!open) : undefined}
                style={canSwitchWorkspace ? undefined : { cursor: 'default' }}
            >
                {workspace && <WorkspaceIcon workspace={workspace} size={22} />}
                <S.Name>{workspace?.name || 'Select workspace'}</S.Name>
                {canSwitchWorkspace && <Icon icon="lucide:chevron-down" width={12} height={12} />}
            </S.Select>

            {open && (
                <S.Dropdown>
                    {isAdmin && workspaces.length > 3 && (
                        <S.DropdownTitle>All workspaces ({workspaces.length})</S.DropdownTitle>
                    )}
                    {workspaces.map(item => (
                        <S.Item
                            key={item.id}
                            $active={item.id === workspace?.id}
                            onClick={() => {
                                router.post(`/workspace/${item.id}/switch`, { redirect: currentPath });
                                setOpen(false);
                            }}
                        >
                            <WorkspaceIcon workspace={item} size={20} />
                            <S.ItemLabel>{item.name}</S.ItemLabel>
                        </S.Item>
                    ))}
                    {canCreateWorkspace && (
                        <S.Item
                            onClick={() => {
                                setOpen(false);
                                onCreateWorkspace();
                            }}
                        >
                            <Icon icon="lucide:plus" />
                            <S.ItemLabel>New workspace</S.ItemLabel>
                        </S.Item>
                    )}
                </S.Dropdown>
            )}
        </S.Wrapper>
    );
}
