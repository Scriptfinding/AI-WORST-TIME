import styled, { css } from 'styled-components';

export const FoldersGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
    margin-bottom: 20px;
`;

export const ParentFolder = styled.a<{ $dragOver?: boolean }>`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px dashed ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: all ${({ theme }) => theme.transition.fast};
    opacity: 0.7;

    &:hover {
        opacity: 1;
        border-color: ${({ theme }) => theme.colors.border.light};
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    ${({ $dragOver, theme }) =>
        $dragOver &&
        css`
            opacity: 1;
            border-style: solid;
            border-color: ${theme.colors.accent.primary};
            background: ${theme.colors.accent.primary}18;
            box-shadow: 0 0 0 2px ${theme.colors.accent.primary}40;
        `}
`;

export const ParentFolderIcon = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    flex-shrink: 0;

    svg {
        width: 18px;
        height: 18px;
    }
`;

export const ParentFolderName = styled.span`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const FlowsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-auto-rows: 1fr;
    align-items: stretch;
    gap: 12px;
`;

export const FlowsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const Pagination = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 24px;
`;

export const PageLink = styled.button<{ $active?: boolean }>`
    padding: 6px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
    color: ${({ theme, $active }) =>
        $active ? 'white' : theme.colors.text.secondary};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : 'transparent'};

    &:hover:not(:disabled) {
        background: ${({ theme, $active }) =>
            $active ? theme.colors.accent.primary : theme.colors.bg.hover};
    }

    &:disabled {
        opacity: 0.4;
        cursor: default;
    }
`;

export const DropZone = styled.div<{ $active?: boolean }>`
    min-height: 120px;
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 4px;
    transition: all ${({ theme }) => theme.transition.fast};

    ${({ $active, theme }) =>
        $active &&
        css`
            background: ${theme.colors.accent.primary}08;
            outline: 2px dashed ${theme.colors.accent.primary}50;
            outline-offset: -2px;
        `}
`;
