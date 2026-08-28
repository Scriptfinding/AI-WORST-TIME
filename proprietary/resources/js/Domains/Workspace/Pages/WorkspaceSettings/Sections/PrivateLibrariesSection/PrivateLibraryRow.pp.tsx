import { Icon } from '@/Shared/UI/Icon/Icon';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import PrivateLibraryActionMenu from './PrivateLibraryActionMenu.pp';
import type { PrivateLibrary } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/types.pp';
import * as S from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/PrivateLibraryRow.styled.pp';
import { formatLibraryCachedAt, getLibraryVisibilityIcon, getLibraryVisibilityLabel } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/utils.pp';

interface Props {
    library: PrivateLibrary;
    busy: boolean;
    readOnly: boolean;
    onEdit: (library: PrivateLibrary) => void;
    onRefresh: (library: PrivateLibrary) => void;
    onDelete: (library: PrivateLibrary) => void;
}

export default function PrivateLibraryRow({
    library,
    busy,
    readOnly,
    onEdit,
    onRefresh,
    onDelete,
}: Props) {
    return (
        <S.Row>
            <td>
                <TableCellContent>
                    <S.LibraryCell>
                        <S.LibraryName title={library.description || undefined}>{library.label}</S.LibraryName>
                        {library.last_error && <S.ErrorBox>{library.last_error}</S.ErrorBox>}
                    </S.LibraryCell>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    <S.RepoLink href={library.url} target="_blank" rel="noopener noreferrer" title={library.url}>
                        <Icon icon="lucide:github" width={13} />
                        {library.repo || library.url}
                    </S.RepoLink>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    <S.InlineCell>
                        <Icon icon="lucide:git-branch" width={13} />
                        {library.branch || 'main'}
                    </S.InlineCell>
                </TableCellContent>
            </td>
            <td><TableCellContent $align="center"><S.Number>{library.items_count}</S.Number></TableCellContent></td>
            <td>
                <TableCellContent>
                    <S.DateBadge>
                        <Icon icon="lucide:calendar" width={12} />
                        {formatLibraryCachedAt(library.cached_at)}
                    </S.DateBadge>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    <S.ScopeBadge $scope={library.visibility}>
                        <Icon icon={getLibraryVisibilityIcon(library)} width={10} />
                        {getLibraryVisibilityLabel(library)}
                    </S.ScopeBadge>
                </TableCellContent>
            </td>
            <td><TableCellContent><S.OwnerName>{library.owner?.name || '-'}</S.OwnerName></TableCellContent></td>
            <td>
                <TableCellContent $align="end">
                    {!readOnly && (
                        <PrivateLibraryActionMenu
                            library={library}
                            busy={busy}
                            onEdit={onEdit}
                            onRefresh={onRefresh}
                            onDelete={onDelete}
                        />
                    )}
                </TableCellContent>
            </td>
        </S.Row>
    );
}
