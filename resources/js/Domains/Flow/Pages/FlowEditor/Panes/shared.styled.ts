import styled from 'styled-components';

export const ResourceList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
`;

export const ResourceFooterActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
`;

export const SharedResourceList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
`;

export const SharedResourceScope = styled.span`
    opacity: 0.6;
    font-size: 0.85em;
`;

export const ResourceItem = styled.div`
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    transition: border-color ${({ theme }) => theme.transition.fast};
`;

export const ResourceItemHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};
    &:hover { background: ${({ theme }) => theme.colors.bg.hover}; }
`;

export const ResourceItemIcon = styled.span<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme, $active }) => $active ? theme.colors.accent.success + '10' : theme.colors.bg.primary};
    color: ${({ theme, $active }) => $active ? theme.colors.accent.success : theme.colors.text.tertiary};
    svg { width: 14px; height: 14px; }
`;

export const ResourceItemMeta = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const ResourceItemName = styled.span`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ResourceItemInfo = styled.span`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const ResourceItemActions = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
`;

export const ResourceOverflowWrap = styled.div`
    position: relative;
`;

export const ResourceOverflowButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};
    &:hover { color: ${({ theme }) => theme.colors.text.primary}; background: ${({ theme }) => theme.colors.bg.tertiary}; }
`;

export const ResourceOverflowMenu = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 60;
    min-width: 140px;
    margin-top: 2px;
    padding: 4px 0;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
`;

export const ResourceOverflowMenuItem = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 12px;
    font-size: 12px;
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    transition: background ${({ theme }) => theme.transition.fast};
    &:hover { background: ${({ theme }) => theme.colors.bg.hover}; }
`;

export const ResourceTreeGroupLabel = styled.div<{ $depth: number }>`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0 4px ${({ $depth }) => $depth * 12}px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const ResourceEmptyText = styled.span`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const ResourceSeparator = styled.hr`
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    margin: 4px 0;
`;

export const ResourceSectionLabel = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
