import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import type { FlowRun } from '@/Domains/Flow/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import { PER_PAGE_OPTIONS } from '@/Domains/Flow/Pages/Runs/config';
import { buildPageUrl, getPaginationItems } from '@/Domains/Flow/Pages/Runs/utils';
import * as S from './styled';

interface Props {
    runs: PaginatedData<FlowRun>;
    pageName: string;
    position: 'top' | 'bottom';
    perPage: number;
    onPerPageChange: (value: number) => void;
}

export default function RunsPagination({ runs, pageName, position, perPage, onPerPageChange }: Props) {
    if (position === 'bottom' && runs.last_page <= 1) return null;

    const goToPage = (page: number) => {
        router.visit(buildPageUrl(pageName, page), { preserveState: true, preserveScroll: true });
    };
    const from = runs.from ?? (runs.data.length > 0 ? ((runs.current_page - 1) * runs.per_page) + 1 : 0);
    const to = runs.to ?? (runs.data.length > 0 ? from + runs.data.length - 1 : 0);

    return (
        <S.PaginationWrap $position={position}>
            <S.PaginationTotal>
                Showing {from}-{to} of {runs.total} {runs.total === 1 ? 'run' : 'runs'}
            </S.PaginationTotal>
            {runs.last_page > 1 && (
                <S.PaginationBar>
                    <S.PageLink
                        aria-label="Previous page"
                        title="Previous page"
                        disabled={runs.current_page <= 1}
                        onClick={() => runs.current_page > 1 && goToPage(runs.current_page - 1)}
                    >
                        <Icon icon="lucide:chevron-left" width={14} height={14} />
                    </S.PageLink>
                    {getPaginationItems(runs.current_page, runs.last_page).map(item => (
                        typeof item === 'number' ? (
                            <S.PageLink
                                key={item}
                                $active={item === runs.current_page}
                                onClick={() => item !== runs.current_page && goToPage(item)}
                            >
                                {item}
                            </S.PageLink>
                        ) : (
                            <S.PageEllipsis key={item}>...</S.PageEllipsis>
                        )
                    ))}
                    <S.PageLink
                        aria-label="Next page"
                        title="Next page"
                        disabled={runs.current_page >= runs.last_page}
                        onClick={() => runs.current_page < runs.last_page && goToPage(runs.current_page + 1)}
                    >
                        <Icon icon="lucide:chevron-right" width={14} height={14} />
                    </S.PageLink>
                </S.PaginationBar>
            )}
            <S.PaginationLimit>
                <span>Limit</span>
                <S.PaginationLimitSelect value={perPage} onChange={event => onPerPageChange(Number(event.target.value))}>
                    {PER_PAGE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </S.PaginationLimitSelect>
            </S.PaginationLimit>
        </S.PaginationWrap>
    );
}
