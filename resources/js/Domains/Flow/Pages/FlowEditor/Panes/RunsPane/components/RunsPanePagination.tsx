import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import type { FlowRun } from '@/Domains/Flow/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import { getRunPaginationItems, RUN_PER_PAGE_OPTIONS } from '@/Domains/Flow/Pages/runHistory';
import * as S from './RunsPanePagination.styled';

interface Props {
    runs: PaginatedData<FlowRun>;
    position: 'top' | 'bottom';
    perPage: number;
    onPerPageChange: (value: number) => void;
}

const MAX_PAGINATION_PAGES = 3;

export default function RunsPanePagination({ runs, position, perPage, onPerPageChange }: Props) {
    const from = runs.from ?? (runs.data.length > 0 ? ((runs.current_page - 1) * runs.per_page) + 1 : 0);
    const to = runs.to ?? (runs.data.length > 0 ? from + runs.data.length - 1 : 0);

    const goToPage = (page: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', String(page));
        const url = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    return (
        <S.RunPaginationBar $position={position}>
            <S.PerPageLabel $summary>
                Showing {from}-{to} of {runs.total} {runs.total === 1 ? 'run' : 'runs'}
            </S.PerPageLabel>
            <S.PerPageWrapper>
                <S.PerPageLabel>Limit</S.PerPageLabel>
                <S.PerPageSelect
                    value={perPage}
                    onChange={event => onPerPageChange(Number(event.target.value))}
                >
                    {RUN_PER_PAGE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </S.PerPageSelect>
            </S.PerPageWrapper>
            {runs.last_page > 1 && (
                <S.RunPagination>
                    <S.RunPageLink
                        type="button"
                        aria-label="Previous page"
                        title="Previous page"
                        disabled={runs.current_page <= 1}
                        onClick={() => runs.current_page > 1 && goToPage(runs.current_page - 1)}
                    >
                        <Icon icon="lucide:chevron-left" width={13} height={13} />
                    </S.RunPageLink>
                    {getRunPaginationItems(runs.current_page, runs.last_page, MAX_PAGINATION_PAGES).map(item => (
                        typeof item === 'number' ? (
                            <S.RunPageLink
                                key={item}
                                type="button"
                                $active={item === runs.current_page}
                                onClick={() => item !== runs.current_page && goToPage(item)}
                            >
                                {item}
                            </S.RunPageLink>
                        ) : (
                            <S.PerPageLabel key={item}>...</S.PerPageLabel>
                        )
                    ))}
                    <S.RunPageLink
                        type="button"
                        aria-label="Next page"
                        title="Next page"
                        disabled={runs.current_page >= runs.last_page}
                        onClick={() => runs.current_page < runs.last_page && goToPage(runs.current_page + 1)}
                    >
                        <Icon icon="lucide:chevron-right" width={13} height={13} />
                    </S.RunPageLink>
                </S.RunPagination>
            )}
        </S.RunPaginationBar>
    );
}
