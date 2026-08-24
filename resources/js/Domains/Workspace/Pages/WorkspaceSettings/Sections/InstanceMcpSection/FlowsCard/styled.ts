import styled from 'styled-components';

export const SectionHint = styled.div`
    margin-top: -10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    line-height: 1.45;
`;

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 0;
`;

export const ErrorBox = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.4;
`;

export const EmptyState = styled.div`
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 18px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    text-align: center;
`;

export const TableWrapper = styled.div`
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
`;
