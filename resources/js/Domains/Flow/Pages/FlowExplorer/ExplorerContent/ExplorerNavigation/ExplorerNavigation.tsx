import React, { useCallback, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import type { Breadcrumb, Folder } from '@/Domains/Folder/types';
import { getFolderUrl } from '@/Domains/Flow/Pages/FlowExplorer/ExplorerContent/utils';
import { useGlobalDragReset } from '@/Domains/Flow/Pages/FlowExplorer/useGlobalDragReset';
import type { User } from '@/App/types';
import * as S from './styled';

interface Props {
    isWorkspaceView: boolean;
    currentFolder: Folder | null;
    breadcrumbs: Breadcrumb[];
    personalOwner: Pick<User, 'id' | 'name'>;
    isOtherOwner: boolean;
    isUsersView: boolean;
    onDrop: (event: React.DragEvent, folderId: Id | null) => void;
}

export default function ExplorerNavigation({ isWorkspaceView, currentFolder, breadcrumbs, personalOwner, isOtherOwner, isUsersView, onDrop }: Props) {
    const [dragOver, setDragOver] = useState<Id | null>(null);
    const rootUrl = isWorkspaceView
        ? '/flows?view=workspace'
        : (isUsersView || isOtherOwner)
            ? '/flows?view=users'
            : '/flows';
    const rootIcon = isWorkspaceView
        ? 'lucide:building-2'
        : (isUsersView || isOtherOwner) ? 'lucide:users' : 'lucide:home';
    const rootLabel = isWorkspaceView
        ? 'Workspace'
        : (isUsersView || isOtherOwner) ? 'Users' : 'Personal';

    const resetDragState = useCallback(() => setDragOver(null), []);
    useGlobalDragReset(resetDragState, true);

    const handleDragOver = useCallback((event: React.DragEvent, id: Id | null) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOver(id);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragOver(null);
        }
    }, []);

    const handleDrop = useCallback((event: React.DragEvent, folderId: Id | null) => {
        setDragOver(null);
        onDrop(event, folderId);
    }, [onDrop]);

    return (
        <>
            <S.MobilePills>
                <S.MobilePill
                    href="/flows"
                    $active={!isWorkspaceView}
                    onClick={event => handleLinkClick(event, '/flows')}
                >
                    <Icon icon="lucide:home" />
                    Personal
                </S.MobilePill>
                <S.MobilePill
                    href="/flows?view=workspace"
                    $active={isWorkspaceView}
                    onClick={event => handleLinkClick(event, '/flows?view=workspace')}
                >
                    <Icon icon="lucide:building-2" />
                    Workspace
                </S.MobilePill>
            </S.MobilePills>

            <S.Breadcrumbs>
                <S.BreadcrumbItem
                    href={rootUrl}
                    $active={!currentFolder && !isOtherOwner}
                    $dragOver={dragOver === 'root'}
                    onClick={event => handleLinkClick(event, rootUrl)}
                    onDragOver={event => {
                        if (!isOtherOwner && !isUsersView) handleDragOver(event, 'root');
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={event => {
                        if (!isOtherOwner && !isUsersView) handleDrop(event, null);
                    }}
                >
                    <Icon icon={rootIcon} width={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                    {rootLabel}
                </S.BreadcrumbItem>

                {isOtherOwner && (
                    <>
                        <S.BreadcrumbSep>/</S.BreadcrumbSep>
                        <S.BreadcrumbItem
                            href={`/flows?owner_id=${personalOwner.id}`}
                            $active={!currentFolder}
                            $dragOver={false}
                            onClick={event => handleLinkClick(event, `/flows?owner_id=${personalOwner.id}`)}
                        >
                            <Icon icon="lucide:user" width={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                            {personalOwner.name}
                        </S.BreadcrumbItem>
                    </>
                )}

                {breadcrumbs.map((breadcrumb, index) => {
                    const url = getFolderUrl(breadcrumb.id!, isWorkspaceView);
                    return (
                        <React.Fragment key={breadcrumb.id}>
                            <S.BreadcrumbSep>/</S.BreadcrumbSep>
                            <S.BreadcrumbItem
                                href={url}
                                $active={index === breadcrumbs.length - 1}
                                $dragOver={dragOver === breadcrumb.id}
                                onClick={event => handleLinkClick(event, url)}
                                onDragOver={event => handleDragOver(event, breadcrumb.id ?? null)}
                                onDragLeave={handleDragLeave}
                                onDrop={event => handleDrop(event, breadcrumb.id ?? null)}
                            >
                                {isWorkspaceView && breadcrumb.team_id && index === 0 && (
                                    <Icon icon="lucide:users" width={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                                )}
                                {breadcrumb.name}
                            </S.BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </S.Breadcrumbs>
        </>
    );
}
