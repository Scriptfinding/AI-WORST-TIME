import Button from '@/Shared/UI/Button/Button';
import * as S from './FlowsPagination.styled';

interface Props {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

export default function FlowsPagination({
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    onPageChange,
    onPageSizeChange,
}: Props) {
    return (
        <S.TableFooter>
            <S.InlineHint>
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </S.InlineHint>
            <S.PaginationControls>
                <label>
                    Rows
                    <S.PageSizeSelect
                        value={pageSize}
                        onChange={event => onPageSizeChange(Number(event.target.value))}
                    >
                        {[5, 10, 20, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </S.PageSizeSelect>
                </label>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                >
                    Previous
                </Button>
                <S.InlineHint>
                    Page {currentPage} of {totalPages}
                </S.InlineHint>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                >
                    Next
                </Button>
            </S.PaginationControls>
        </S.TableFooter>
    );
}
