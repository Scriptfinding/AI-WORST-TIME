import styled from 'styled-components';

export const EmptyNode = styled.div`
    position: absolute;
    top: 140px;
    left: 140px;
    width: min(360px, calc(100vw - 48px));
    padding: 22px;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.md};
    text-align: center;
`;

export const EmptyIcon = styled.div`
    width: 42px;
    height: 42px;
    margin: 0 auto 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.accent.primary};
    background: ${({ theme }) => theme.colors.accent.primary}15;
`;

export const EmptyTitle = styled.h3`
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const EmptyText = styled.p`
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const SelectionBox = styled.div`
    position: absolute;
    border: 1px dotted ${({ theme }) => theme.colors.accent.primary};
    background: ${({ theme }) => theme.colors.accent.primary}18;
    pointer-events: none;
`;
