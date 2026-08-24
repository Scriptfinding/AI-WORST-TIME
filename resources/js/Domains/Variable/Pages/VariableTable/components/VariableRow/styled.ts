import styled from 'styled-components';

export const Cell = styled.td<{ $indent?: number }>`
    padding: 10px 14px;
    padding-left: ${({ $indent }) => $indent ? `${$indent}px` : undefined};
    font-size: 13px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    tr:last-child & {
        border-bottom: none;
    }
`;

export const VariableKey = styled.code`
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    font-weight: 500;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: help;
    outline: none;

    &:focus-visible {
        box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.accent.success}24;
    }
`;

export const KeyContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const VariableIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const RuntimeRestriction = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.accent.warning};
    background: ${({ theme }) => theme.colors.accent.warning}18;
    cursor: help;
    outline: none;
    transition:
        color ${({ theme }) => theme.transition.fast},
        background ${({ theme }) => theme.transition.fast},
        box-shadow ${({ theme }) => theme.transition.fast};

    &:hover,
    &:focus-visible {
        background: ${({ theme }) => theme.colors.accent.warning}26;
        box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.accent.warning}24;
    }
`;

export const RuntimeTooltip = styled.div<{ $available: boolean }>`
    position: fixed;
    z-index: 1000;
    width: 320px;
    padding: 12px;
    border: 1px solid ${({ $available, theme }) =>
        ($available ? theme.colors.accent.success : theme.colors.accent.warning) + '42'};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    white-space: normal;

    &::before {
        content: '';
        position: absolute;
        top: -5px;
        left: 18px;
        width: 9px;
        height: 9px;
        border-top: 1px solid ${({ $available, theme }) =>
            ($available ? theme.colors.accent.success : theme.colors.accent.warning) + '42'};
        border-left: 1px solid ${({ $available, theme }) =>
            ($available ? theme.colors.accent.success : theme.colors.accent.warning) + '42'};
        background: ${({ theme }) => theme.colors.bg.primary};
        transform: rotate(45deg);
    }
`;

export const RuntimeTooltipBody = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    line-height: 1.55;

    code {
        padding: 1px 4px;
        border-radius: ${({ theme }) => theme.radius.sm};
        background: ${({ theme }) => theme.colors.bg.tertiary};
        color: ${({ theme }) => theme.colors.text.primary};
        font-family: ${({ theme }) => theme.font.mono};
        font-size: 10px;
    }
`;

export const ConnectionName = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};

    svg {
        flex-shrink: 0;
        opacity: 0.5;
    }
`;

export const ConnectionMissing = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;

export const ScopeBadge = styled.span<{ $scope: string; $color?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    white-space: nowrap;
    background: ${({ $scope, $color, theme }) =>
        $scope === 'workspace' ? ($color || '#3b82f6') + '18' :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') + '18' :
        '#eab30818'};
    color: ${({ $scope, $color, theme }) =>
        $scope === 'workspace' ? ($color || '#3b82f6') :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') :
        '#eab308'};
`;

export const OwnerName = styled.span`
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const ActionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const DangerActionButton = styled(ActionButton)`
    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
    }
`;
