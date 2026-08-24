import styled, { css } from 'styled-components';

export const Cell = styled.td<{ $indent?: number; $center?: boolean }>`
    padding: 10px 14px;
    padding-left: ${({ $indent }) => $indent ? `${$indent}px` : undefined};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    text-align: ${({ $center }) => $center ? 'center' : undefined};

    tr:last-child & {
        border-bottom: none;
    }
`;

export const ChannelIdentity = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const ChannelIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ChannelName = styled.code`
    font-size: 12px;
    font-weight: 400;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
`;

export const ProviderBadge = styled.span<{ $provider: string }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
    ${({ $provider, theme }) => {
        if (theme.mode === 'dark') {
            if ($provider === 'telegram') return css`background: #0088cc; color: #fff;`;
            if ($provider === 'discord') return css`background: #5865F2; color: #fff;`;
            if ($provider === 'slack') return css`background: #4A154B; color: #fff;`;
        } else {
            if ($provider === 'telegram') return css`background: #E3F2FD; color: #1565C0;`;
            if ($provider === 'discord') return css`background: #EDE7F6; color: #5C6BC0;`;
            if ($provider === 'slack') return css`background: #FFF3E0; color: #E65100;`;
        }
        return css`background: ${theme.colors.bg.tertiary}; color: ${theme.colors.text.secondary};`;
    }}
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

export const Destination = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
    font-weight: 500;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        opacity: 0.6;
    }
`;

export const DestinationId = styled.span`
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const StatusBadge = styled.span<{ $active: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.successBg : theme.colors.accent.defaultBg};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.success : theme.colors.text.tertiary};
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
    padding: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const DangerActionButton = styled(ActionButton)`
    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.accent.error}15;
    }
`;
