import React from 'react';
import * as S from './styled';

const PER_PAGE_OPTIONS = [10, 20, 50];

interface Props {
    page: number;
    pageCount: number;
    perPage: number;
    onPageChange: (value: number) => void;
    onPerPageChange: (value: number) => void;
}

export default function LibraryStorePagination({
    page,
    pageCount,
    perPage,
    onPageChange,
    onPerPageChange,
}: Props) {
    return (
        <S.Pagination>
            <S.PageButton type="button" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
                Previous
            </S.PageButton>
            <S.PageInfo>
                Page {page} of {pageCount}
            </S.PageInfo>
            <S.PageButton
                type="button"
                disabled={page === pageCount}
                onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            >
                Next
            </S.PageButton>
            <S.PageSizeSelect
                value={perPage}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onPerPageChange(Number(event.target.value))}
            >
                {PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option} / page</option>
                ))}
            </S.PageSizeSelect>
        </S.Pagination>
    );
}
