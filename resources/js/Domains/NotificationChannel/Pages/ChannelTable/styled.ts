import styled from 'styled-components';

export const Empty = styled.div`
    text-align: center;
    padding: 48px 16px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;

export const TableWrapper = styled.div`
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    min-width: 980px;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    overflow: hidden;
`;

export const Thead = styled.thead`
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const Th = styled.th<{ $center?: boolean; $width?: number }>`
    text-align: ${({ $center }) => $center ? 'center' : 'left'};
    width: ${({ $width }) => $width ? `${$width}px` : undefined};
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;
