import styled from 'styled-components';

export const Row = styled.div<{ $active?: boolean; $depth: number }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    padding-left: ${({ $depth }) => $depth > 0 ? `${$depth * 14}px` : '14px'};
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};
    background: ${({ $active, theme }) => $active ? theme.colors.bg.hover : 'transparent'};
    border-left: 3px solid ${({ $active, theme }) => $active ? theme.colors.accent.primary : 'transparent'};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.secondary};
    }

    svg {
        margin-right: 0;
    }
`;

export const AddressWrap = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
`;

export const Address = styled.span`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Domain = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    margin-left: 1px;
`;

export const Meta = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
`;

export const Owner = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const TeamBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 9px;
    font-weight: 500;
    padding: 1px 5px;
    border-radius: 99px;
    background: ${({ theme }) => (theme.colors.accent.success || '#22c55e') + '14'};
    color: ${({ theme }) => theme.colors.accent.success || '#22c55e'};
    white-space: nowrap;
    flex-shrink: 0;

    svg {
        flex-shrink: 0;
    }
`;

export const UnreadBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 10px;
    font-weight: 600;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.colors.accent.primary};
    color: white;
    flex-shrink: 0;
`;

export const Actions = styled.div`
    display: none;
    align-items: center;
    gap: 2px;
    margin-left: 6px;
    flex-shrink: 0;

    ${Row}:hover & {
        display: flex;
    }
`;

export const ActionButton = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    background: none;
    border: none;
    border-radius: ${({ theme }) => theme.radius.xs};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    flex-shrink: 0;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.accent.primary};
        background: ${({ $danger, theme }) => $danger ? theme.colors.accent.errorBg : theme.colors.accent.primary + '15'};
    }
`;

export const ScopeIcon = styled.span<{ $workspace?: boolean; $team?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    border: 1.5px solid ${({ $workspace, $team, theme }) =>
        $workspace ? (theme.colors.accent.info || '#3b82f6') + '40'
            : $team ? (theme.colors.accent.success || '#22c55e') + '40'
                : '#eab30840'};
    background: ${({ $workspace, $team, theme }) =>
        $workspace ? (theme.colors.accent.info || '#3b82f6') + '14'
            : $team ? (theme.colors.accent.success || '#22c55e') + '14'
                : '#eab30814'};
    color: ${({ $workspace, $team }) =>
        $workspace ? '#3b82f6' : $team ? '#22c55e' : '#eab308'};

    &::after {
        content: attr(data-tip);
        position: absolute;
        left: 50%;
        bottom: calc(100% + 6px);
        transform: translateX(-50%);
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        border-radius: 4px;
        background: ${({ theme }) => theme.colors.text.primary};
        color: ${({ theme }) => theme.colors.bg.primary};
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.12s;
        z-index: 10;
    }

    &:hover::after {
        opacity: 1;
    }
`;
