import { Icon } from '@/Shared/UI/Icon/Icon';
import type { ApiKey } from '@/Domains/Profile/types';
import { formatDate } from '@/Shared/Utils/formatDate';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import * as S from './styled';

interface ApiKeysListProps {
    apiKeys: ApiKey[];
    search: string;
    onDelete: (keyId: number) => void;
    onSearchChange: (search: string) => void;
}

export default function ApiKeysList({
    apiKeys,
    search,
    onDelete,
    onSearchChange,
}: ApiKeysListProps) {
    return (
        <>
            <S.SearchWrapper>
                <Icon icon="lucide:search" width={14} height={14} />
                <S.SearchInput
                    value={search}
                    onChange={event => onSearchChange(event.target.value)}
                    placeholder="Search API keys..."
                />
            </S.SearchWrapper>

            <S.TableWrapper>
                <S.Table>
                    <thead>
                        <tr>
                            <S.Th>Name</S.Th>
                            <S.Th>Key</S.Th>
                            <S.Th>Created</S.Th>
                            <S.Th>Last used</S.Th>
                            <S.Th $right />
                        </tr>
                    </thead>
                    <tbody>
                        {apiKeys.length === 0 && (
                            <tr>
                                <S.Td colSpan={5}>
                                    <TableCellContent $align="center">
                                        <S.Empty>
                                            {search ? 'No API keys match your search.' : 'No API keys yet.'}
                                        </S.Empty>
                                    </TableCellContent>
                                </S.Td>
                            </tr>
                        )}
                        {apiKeys.map(key => (
                            <tr key={key.id}>
                                <S.Td>
                                    <TableCellContent>
                                        <S.KeyName>
                                            <S.KeyIcon>
                                                <Icon icon="lucide:key" width={13} height={13} />
                                            </S.KeyIcon>
                                            {key.name}
                                        </S.KeyName>
                                    </TableCellContent>
                                </S.Td>
                                <S.Td>
                                    <TableCellContent><S.KeyPreview>{key.key_preview || '-'}</S.KeyPreview></TableCellContent>
                                </S.Td>
                                <S.Td>
                                    <TableCellContent>
                                        <S.DateBadge>
                                            <Icon icon="lucide:calendar" width={11} height={11} />
                                            {formatDate(key.created_at)}
                                        </S.DateBadge>
                                    </TableCellContent>
                                </S.Td>
                                <S.Td>
                                    <TableCellContent>
                                        {key.last_used_at ? (
                                            <S.DateBadge>
                                                <Icon icon="lucide:activity" width={11} height={11} />
                                                {formatDate(key.last_used_at)}
                                            </S.DateBadge>
                                        ) : (
                                            <S.NeverUsed>
                                                <Icon icon="lucide:circle-minus" width={12} height={12} />
                                                Never used
                                            </S.NeverUsed>
                                        )}
                                    </TableCellContent>
                                </S.Td>
                                <S.Td $right>
                                    <TableCellContent $align="end">
                                        <S.DeleteButton onClick={() => onDelete(key.id)} title="Delete key">
                                            <Icon icon="lucide:trash-2" width={14} height={14} />
                                        </S.DeleteButton>
                                    </TableCellContent>
                                </S.Td>
                            </tr>
                        ))}
                    </tbody>
                </S.Table>
            </S.TableWrapper>
        </>
    );
}
