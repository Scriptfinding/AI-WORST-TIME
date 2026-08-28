import { router } from '@inertiajs/react';
import { useAuth, usePageProps } from '@/App/Hooks/usePageProps';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { UserVariable } from '@/Domains/Variable/types';
import { useCollapsedGroups } from '@/Shared/UI/TableFilters/useCollapsedGroups';
import FilterToolbar from './components/FilterToolbar/FilterToolbar';
import GroupedRows from './components/GroupedRows/GroupedRows';
import type { VariableTableFilters, VariableTableTeam } from './types';
import * as S from './styled';

interface VariableTableProps {
    variables: PaginatedData<UserVariable>;
    groups: string[];
    teams: VariableTableTeam[];
    filters: VariableTableFilters;
    wsColor?: string;
    selectedIds: Set<Id>;
    onToggleSelected: (variableId: Id) => void;
    onEdit: (variable: UserVariable) => void;
    onDelete: (variable: UserVariable) => void;
    onInspect: (variable: UserVariable) => void;
}

export default function VariableTable({
    variables,
    groups,
    teams = [],
    filters,
    wsColor,
    selectedIds,
    onToggleSelected,
    onEdit,
    onDelete,
    onInspect,
}: VariableTableProps) {
    const { user } = useAuth();
    const { settings } = usePageProps();
    const { collapsedGroups, isGroupHidden, toggleGroup } = useCollapsedGroups(
        `variable-collapsed-groups:${user?.id ?? 'anonymous'}`,
    );
    const selectableIds = variables.data
        .filter(variable => variable.can_manage)
        .map(variable => variable.id);
    const allVisibleSelected = selectableIds.length > 0
        && selectableIds.every(id => selectedIds.has(id));
    const toggleAllVisible = () => {
        selectableIds.forEach(id => {
            if (selectedIds.has(id) === allVisibleSelected) onToggleSelected(id);
        });
    };

    return (
        <>
            <FilterToolbar
                filters={filters}
                groups={groups}
                teams={teams}
                workspaceSharingEnabled={settings?.workspace_sharing_enabled ?? false}
            />
            {selectableIds.length > 0 && (
                <S.SelectionBar
                    allSelected={allVisibleSelected}
                    itemLabel="variables"
                    onToggle={toggleAllVisible}
                />
            )}
            {variables.data.length === 0 ? (
                <S.Empty>
                    {filters.search || filters.group !== null || filters.scope
                        ? 'No variables match your filters.'
                        : 'No variables yet.'
                    }
                </S.Empty>
            ) : (
                <S.TableWrapper>
                    <S.Table>
                        <S.Thead>
                            <tr>
                                <S.Th>Key</S.Th>
                                <S.Th>Value</S.Th>
                                <S.Th>Type</S.Th>
                                <S.Th>Connection</S.Th>
                                <S.Th>Visibility</S.Th>
                                <S.Th>Owner</S.Th>
                                <S.Th $width={80} />
                            </tr>
                        </S.Thead>
                        <tbody>
                            <GroupedRows
                                variables={variables.data}
                                selectedIds={selectedIds}
                                onToggleSelected={onToggleSelected}
                                collapsedGroups={collapsedGroups}
                                isGroupHidden={isGroupHidden}
                                workspaceColor={wsColor}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onInspect={onInspect}
                                onToggleGroup={toggleGroup}
                            />
                        </tbody>
                    </S.Table>
                </S.TableWrapper>
            )}
            {variables.last_page > 1 && (
                <S.Pagination>
                    {variables.links.map((link, index) => (
                        <S.PageLink
                            key={index}
                            $active={link.active}
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </S.Pagination>
            )}
        </>
    );
}
