import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import RunListItem from '@/Domains/Flow/Components/Run/RunListItem';
import type { FlowRun } from '@/Domains/Flow/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import { SelectionButtonLabel } from '@/Domains/Flow/Pages/Runs/shared.styled';
import RunsPagination from '@/Domains/Flow/Pages/Runs/components/RunsPagination/RunsPagination';
import SelectionActions from '@/Domains/Flow/Pages/Runs/components/SelectionActions/SelectionActions';
import * as S from './styled';

interface Props {
    title: string;
    runs: PaginatedData<FlowRun>;
    pageName: string;
    selectedRuns: FlowRun[];
    selectedRunIds: Set<number>;
    waitingHumanIds: Set<number>;
    loading: boolean;
    deleting: boolean;
    perPage: number;
    onPerPageChange: (value: number) => void;
    onOpen: (run: FlowRun) => void;
    onToggleSelect: (run: FlowRun) => void;
    onToggleVisible: (runs: FlowRun[]) => void;
    onClearSelection: (runs: FlowRun[]) => void;
    onDeleteSelected: (runs: FlowRun[]) => void;
    onKill: (run: FlowRun) => void;
}

export default function RunsSection({
    title,
    runs,
    pageName,
    selectedRuns,
    selectedRunIds,
    waitingHumanIds,
    loading,
    deleting,
    perPage,
    onPerPageChange,
    onOpen,
    onToggleSelect,
    onToggleVisible,
    onClearSelection,
    onDeleteSelected,
    onKill,
}: Props) {
    if (runs.total === 0) return null;

    const allVisibleSelected = runs.data.length > 0 && runs.data.every(run => selectedRunIds.has(run.id));

    return (
        <S.Section>
            <S.SectionHeader>
                <S.SectionTitle>{title}</S.SectionTitle>
                <S.SectionHeaderActions>
                    <SelectionActions
                        runs={selectedRuns}
                        deleting={deleting}
                        onClear={onClearSelection}
                        onDelete={onDeleteSelected}
                    />
                    <Button variant="secondary" size="sm" onClick={() => onToggleVisible(runs.data)}>
                        <Icon icon="lucide:check-square" width={14} />
                        <SelectionButtonLabel>{allVisibleSelected ? 'Uncheck all' : 'Check all'}</SelectionButtonLabel>
                    </Button>
                    <RunsPagination
                        runs={runs}
                        pageName={pageName}
                        position="top"
                        perPage={perPage}
                        onPerPageChange={onPerPageChange}
                    />
                </S.SectionHeaderActions>
            </S.SectionHeader>
            <S.RunListWrap $hasBottomPagination={runs.last_page > 1}>
                <S.RunList $dimmed={loading}>
                    {runs.data.map(run => (
                        <RunListItem
                            key={run.id}
                            run={run}
                            waitingHuman={waitingHumanIds.has(run.id)}
                            selectable
                            selected={selectedRunIds.has(run.id)}
                            selectionActive={selectedRuns.length > 0}
                            onOpen={onOpen}
                            onToggleSelect={onToggleSelect}
                            onKill={onKill}
                        />
                    ))}
                </S.RunList>
                <RunsPagination
                    runs={runs}
                    pageName={pageName}
                    position="bottom"
                    perPage={perPage}
                    onPerPageChange={onPerPageChange}
                />
            </S.RunListWrap>
        </S.Section>
    );
}
