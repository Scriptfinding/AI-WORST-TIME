import React, { useMemo, useState } from 'react';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { WorkspaceWithRelations } from '@/Domains/Admin/Pages/Workspaces/Workspaces';
import WorkspacePagination from './WorkspacePagination/WorkspacePagination';
import WorkspaceRow from './WorkspaceRow/WorkspaceRow';
import WorkspaceToolbar from './WorkspaceToolbar/WorkspaceToolbar';
import * as S from './styled';

interface Props {
    workspaces: PaginatedData<WorkspaceWithRelations>;
    workspaceLimit: number;
    workspaceCount: number;
    onDeleteTarget: (ws: WorkspaceWithRelations) => void;
    onMembersTarget: (ws: WorkspaceWithRelations) => void;
    onFlowsTarget: (ws: WorkspaceWithRelations) => void;
    onEditTarget: (ws: WorkspaceWithRelations) => void;
    onTransferOwnership: (ws: WorkspaceWithRelations) => void;
}

export default function WorkspaceTable({
    workspaces,
    workspaceLimit,
    workspaceCount,
    onDeleteTarget,
    onMembersTarget,
    onFlowsTarget,
    onEditTarget,
    onTransferOwnership,
}: Props) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return workspaces.data;
        const q = search.toLowerCase();
        return workspaces.data.filter(ws =>
            ws.name.toLowerCase().includes(q)
            || ws.lookup_key?.toLowerCase().includes(q),
        );
    }, [workspaces.data, search]);

    const hasActiveFilters = Boolean(search.trim());

    return (
        <S.Panel>
            <WorkspaceToolbar
                search={search}
                filteredCount={filtered.length}
                totalCount={workspaces.total}
                workspaceCount={workspaceCount}
                workspaceLimit={workspaceLimit}
                onSearchChange={setSearch}
            />

            <S.TableWrapper>
                <S.Table>
                    <thead>
                        <tr>
                            <S.Th>ID</S.Th>
                            <S.Th>Name</S.Th>
                            <S.Th>Lookup key</S.Th>
                            <S.Th>Owner</S.Th>
                            <S.Th $center>Members</S.Th>
                            <S.Th $center>Flows</S.Th>
                            <S.Th>Expires</S.Th>
                            <S.Th>Created</S.Th>
                            <S.Th $right />
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <S.EmptyCell colSpan={9}>
                                    <S.EmptyState>
                                        {hasActiveFilters
                                            ? 'No workspaces match your search.'
                                            : 'No workspaces yet.'}
                                    </S.EmptyState>
                                </S.EmptyCell>
                            </tr>
                        )}
                        {filtered.map(workspace => (
                            <WorkspaceRow
                                key={workspace.id}
                                workspace={workspace}
                                onDelete={onDeleteTarget}
                                onViewMembers={onMembersTarget}
                                onViewFlows={onFlowsTarget}
                                onEdit={onEditTarget}
                                onTransferOwnership={onTransferOwnership}
                            />
                        ))}
                    </tbody>
                </S.Table>
            </S.TableWrapper>

            <WorkspacePagination pagination={workspaces} />
        </S.Panel>
    );
}
