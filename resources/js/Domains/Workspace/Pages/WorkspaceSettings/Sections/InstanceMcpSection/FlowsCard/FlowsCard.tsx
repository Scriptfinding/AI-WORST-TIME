import { useMemo, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { McpFlow } from '@/Domains/Workspace/types';
import * as SharedS from '@/Domains/Workspace/Pages/WorkspaceSettings/shared.styled';
import { requestJson } from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/InstanceMcpSection/utils';
import FlowsPagination from './FlowsPagination';
import FlowsTable from './FlowsTable';
import * as S from './styled';

interface Props {
    flows: McpFlow[];
    busy: boolean;
    error: string | null;
    readOnly?: boolean;
    setBusy: (busy: boolean) => void;
    setError: (error: string | null) => void;
}

export default function FlowsCard({ flows, busy, error, readOnly, setBusy, setError }: Props) {
    const { confirm, ConfirmModal } = useConfirm();
    const [currentFlows, setCurrentFlows] = useState(flows);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const exposedCount = useMemo(() => currentFlows.filter(flow => flow.available_in_mcp).length, [currentFlows]);
    const totalPages = Math.max(1, Math.ceil(currentFlows.length / pageSize));
    const normalizedPage = Math.min(page, totalPages);
    const paginatedFlows = useMemo(() => {
        const offset = (normalizedPage - 1) * pageSize;
        return currentFlows.slice(offset, offset + pageSize);
    }, [currentFlows, pageSize, normalizedPage]);

    const updateFlow = async (flow: McpFlow, value: boolean) => {
        if (readOnly || busy) return;

        setBusy(true);
        setError(null);
        try {
            await requestJson(`/workspace/mcp/flows/${flow.id}`, {
                method: 'PUT',
                body: JSON.stringify({ available_in_mcp: value }),
            });
            setCurrentFlows(current => current.map(item => item.id === flow.id ? { ...item, available_in_mcp: value } : item));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update flow MCP access.');
        } finally {
            setBusy(false);
        }
    };

    const bulkUpdateFlows = async (value: boolean) => {
        if (readOnly || busy) return;

        const ok = await confirm({
            title: value ? 'Expose all flows in MCP?' : 'Remove all flows from MCP?',
            message: value
                ? 'All workspace flows will become available to MCP clients that use a valid token and have user permission.'
                : 'All workspace flows will be unavailable for full MCP details and runs.',
            confirmLabel: value ? 'Expose all' : 'Remove all',
            variant: value ? 'primary' : 'danger',
        });
        if (!ok) return;

        setBusy(true);
        setError(null);
        try {
            await requestJson('/workspace/mcp/flows', {
                method: 'PUT',
                body: JSON.stringify({ available_in_mcp: value }),
            });
            setCurrentFlows(current => current.map(flow => ({ ...flow, available_in_mcp: value })));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update flows.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <SharedS.Card>
                <SharedS.CardTitle>
                    <Icon icon="lucide:workflow" width={15} height={15} />
                    Exposed Flows
                </SharedS.CardTitle>
                <S.SectionHint>
                    {exposedCount} of {currentFlows.length} flows are available for full MCP details, runs, artifacts and human in the loop continuation.
                </S.SectionHint>
                {!readOnly && currentFlows.length > 0 && (
                    <S.Toolbar>
                        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void bulkUpdateFlows(true)}>
                            Expose all
                        </Button>
                        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void bulkUpdateFlows(false)}>
                            Remove all
                        </Button>
                    </S.Toolbar>
                )}
                {error && <S.ErrorBox>{error}</S.ErrorBox>}
                {currentFlows.length === 0 ? (
                    <S.EmptyState>No flows in this workspace.</S.EmptyState>
                ) : (
                    <S.TableWrapper>
                        <FlowsTable
                            flows={paginatedFlows}
                            busy={busy}
                            readOnly={readOnly}
                            onUpdate={(flow, value) => void updateFlow(flow, value)}
                        />
                        <FlowsPagination
                            currentPage={normalizedPage}
                            pageSize={pageSize}
                            totalItems={currentFlows.length}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            onPageSizeChange={size => {
                                setPageSize(size);
                                setPage(1);
                            }}
                        />
                    </S.TableWrapper>
                )}
            </SharedS.Card>
            <ConfirmModal />
        </>
    );
}
