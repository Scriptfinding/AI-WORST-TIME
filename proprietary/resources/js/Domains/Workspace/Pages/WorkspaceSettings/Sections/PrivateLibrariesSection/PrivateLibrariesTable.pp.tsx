import { Fragment } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import PrivateLibraryRow from './PrivateLibraryRow.pp';
import type { PrivateLibrary } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/types.pp';
import * as S from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/PrivateLibrariesTable.styled.pp';

interface LibraryGroup {
    group: string;
    items: PrivateLibrary[];
}

interface Props {
    groups: LibraryGroup[];
    collapsedGroups: Set<string>;
    busyId: number | null;
    readOnly: boolean;
    onToggleGroup: (group: string) => void;
    onRefresh: (library: PrivateLibrary) => void;
    onDelete: (library: PrivateLibrary) => void;
}

export default function PrivateLibrariesTable({
    groups,
    collapsedGroups,
    busyId,
    readOnly,
    onToggleGroup,
    onRefresh,
    onDelete,
}: Props) {
    return (
        <S.Wrapper>
            <S.Table>
                <thead>
                    <tr>
                        <th>Library</th>
                        <th>Repository</th>
                        <th>Branch</th>
                        <th>Blueprints</th>
                        <th>Cache</th>
                        <th>Visibility</th>
                        <th>Owner</th>
                        <th aria-label="Actions" />
                    </tr>
                </thead>
                <tbody>
                    {groups.map(({ group, items }) => (
                        <Fragment key={group}>
                            <S.GroupRow>
                                <td colSpan={8}>
                                    <TableCellContent>
                                        <S.GroupButton type="button" onClick={() => onToggleGroup(group)}>
                                            <Icon icon={collapsedGroups.has(group) ? 'lucide:chevron-right' : 'lucide:chevron-down'} width={13} />
                                            <Icon icon={group === 'Ungrouped' ? 'lucide:inbox' : 'lucide:folder'} width={13} />
                                            {group}
                                            <S.GroupCount>{items.length}</S.GroupCount>
                                        </S.GroupButton>
                                    </TableCellContent>
                                </td>
                            </S.GroupRow>
                            {!collapsedGroups.has(group) && items.map(library => (
                                <PrivateLibraryRow
                                    key={library.id}
                                    library={library}
                                    busy={busyId === library.id}
                                    readOnly={readOnly}
                                    onRefresh={onRefresh}
                                    onDelete={onDelete}
                                />
                            ))}
                        </Fragment>
                    ))}
                </tbody>
            </S.Table>
        </S.Wrapper>
    );
}
