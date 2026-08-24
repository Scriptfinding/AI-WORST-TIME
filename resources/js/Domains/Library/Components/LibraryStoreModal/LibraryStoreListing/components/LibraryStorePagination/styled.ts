import styled from 'styled-components';

export const Pagination = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding-top: 14px;
    flex-shrink: 0;
`;

export const PageButton = styled.button`
    padding: 6px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }
`;

export const PageInfo = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    font-weight: 700;
`;

export const PageSizeSelect = styled.select`
    padding: 6px 9px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 700;
    outline: none;
`;
