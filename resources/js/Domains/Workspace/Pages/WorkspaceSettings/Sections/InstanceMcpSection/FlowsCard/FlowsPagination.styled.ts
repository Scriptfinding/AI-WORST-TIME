import styled from 'styled-components';

export const TableFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-top: 14px;
    min-width: 0;
    flex-wrap: wrap;

    @media (max-width: 720px) {
        flex-direction: column;
        align-items: flex-start;
    }
`;

export const InlineHint = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.4;
`;

export const PaginationControls = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 11px;
    }
`;

export const PageSizeSelect = styled.select`
    height: 30px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    padding: 0 8px;
`;
