import type { McpFlow } from '@/Domains/Workspace/types';
import FlowRow from './FlowRow';
import * as S from './FlowsTable.styled';

interface Props {
    flows: McpFlow[];
    busy: boolean;
    readOnly?: boolean;
    onUpdate: (flow: McpFlow, value: boolean) => void;
}

export default function FlowsTable({ flows, busy, readOnly, onUpdate }: Props) {
    return (
        <S.FlowTable>
            <thead>
                <tr>
                    <th>Flow</th>
                    <th>Visibility</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>MCP</th>
                    <th aria-label="Actions" />
                </tr>
            </thead>
            <tbody>
                {flows.map(flow => (
                    <FlowRow
                        key={flow.id}
                        flow={flow}
                        busy={busy}
                        readOnly={readOnly}
                        onUpdate={onUpdate}
                    />
                ))}
            </tbody>
        </S.FlowTable>
    );
}
