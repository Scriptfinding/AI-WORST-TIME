import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import type { McpFlow } from '@/Domains/Workspace/types';
import { scopeLabel } from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/InstanceMcpSection/utils';
import * as S from './FlowRow.styled';

interface Props {
    flow: McpFlow;
    busy: boolean;
    readOnly?: boolean;
    onUpdate: (flow: McpFlow, value: boolean) => void;
}

export default function FlowRow({ flow, busy, readOnly, onUpdate }: Props) {
    return (
        <S.FlowRow>
            <td>
                <TableCellContent>
                    <S.FlowNameCell>
                        <S.FlowName title={flow.name}>{flow.name}</S.FlowName>
                    </S.FlowNameCell>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    <S.ScopeBadge $scope={flow.visibility}>
                        {scopeLabel(flow)}
                    </S.ScopeBadge>
                </TableCellContent>
            </td>
            <td><TableCellContent><S.OwnerName>{flow.owner?.name || '-'}</S.OwnerName></TableCellContent></td>
            <td><TableCellContent>{flow.is_published ? 'Published' : 'Unpublished'}</TableCellContent></td>
            <td>
                <TableCellContent>
                    <Switch
                        id={`flow_mcp_${flow.id}`}
                        checked={flow.available_in_mcp}
                        onChange={value => onUpdate(flow, value)}
                        label={flow.available_in_mcp ? 'Available' : 'Unavailable'}
                        disabled={readOnly || busy}
                    />
                </TableCellContent>
            </td>
            <td>
                <TableCellContent $align="end">
                    <S.TableActions>
                        <S.IconLinkButton href={`/flows/${flow.id}`} target="_blank" rel="noopener noreferrer" title="Open flow">
                            <Icon icon="lucide:external-link" width={14} />
                            Open
                        </S.IconLinkButton>
                    </S.TableActions>
                </TableCellContent>
            </td>
        </S.FlowRow>
    );
}
