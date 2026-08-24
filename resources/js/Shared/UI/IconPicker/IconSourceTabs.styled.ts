import styled from 'styled-components';

export const TabBar = styled.div`
    display: flex;
    gap: 2px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 2px;
`;

export const TabBtn = styled.button<{ $active?: boolean }>`
    flex: 1;
    padding: 6px 0;
    font-size: 12px;
    font-weight: 500;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    color: ${({ theme, $active }) =>
        $active ? theme.colors.text.primary : theme.colors.text.tertiary};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.bg.hover : 'transparent'};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Grid = styled.div<{ $responsive?: boolean }>`
    display: grid;
    grid-template-columns: ${({ $responsive }) =>
        $responsive ? 'repeat(auto-fill, minmax(28px, 1fr))' : 'repeat(14, 1fr)'};
    gap: ${({ $responsive }) => $responsive ? '8px' : '12px'};
    min-width: ${({ $responsive }) => $responsive ? '0' : 'auto'};
    max-width: ${({ $responsive }) => $responsive ? '100%' : 'none'};
`;

export const GridItem = styled.button<{ $active?: boolean; $responsive?: boolean }>`
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: ${({ $responsive }) => $responsive ? '0' : 'auto'};
    font-size: 18px;
    line-height: ${({ $responsive }) => $responsive ? '1' : 'normal'};
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    overflow: ${({ $responsive }) => $responsive ? 'hidden' : 'visible'};
    transition: all ${({ theme }) => theme.transition.fast};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.bg.hover : 'transparent'};
    outline: ${({ $active, theme }) =>
        $active ? `2px solid ${theme.colors.brand}` : '2px solid transparent'};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const UploadArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px;
    border: 1px dashed ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const UploadHint = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;
