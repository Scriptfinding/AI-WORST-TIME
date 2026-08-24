import styled from 'styled-components';
import { SectionTitle } from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';

export const LatestRunDetails = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 20px;
    gap: 8px;
`;

export const LatestRunTitle = styled(SectionTitle)`
    margin: 0;
`;

export const RunItem = styled.div`
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    transition: border-color ${({ theme }) => theme.transition.fast};
`;

export const RunItemHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;

export const RunStatusIcon = styled.span<{
    $variant: 'default' | 'success' | 'warning' | 'error' | 'info';
    $spinning?: boolean;
}>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    background: ${({ theme, $variant }) =>
        $variant === 'success' ? theme.colors.accent.success + '10'
        : $variant === 'warning' ? theme.colors.accent.warning + '10'
        : $variant === 'error' ? theme.colors.accent.error + '10'
        : $variant === 'info' ? theme.colors.accent.info + '10'
        : theme.colors.bg.primary};
    border-radius: 50%;
    color: ${({ theme, $variant }) =>
        $variant === 'success' ? theme.colors.accent.success
        : $variant === 'warning' ? theme.colors.accent.warning
        : $variant === 'error' ? theme.colors.accent.error
        : $variant === 'info' ? theme.colors.accent.info
        : theme.colors.text.tertiary};

    svg {
        width: 14px;
        height: 14px;
        ${({ $spinning }) => $spinning && 'animation: status-spin 1s linear infinite;'}
    }

    @keyframes status-spin {
        to { transform: rotate(360deg); }
    }
`;

export const WaitingHumanIcon = styled.span`
    display: inline-flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.accent.info};
    flex-shrink: 0;
`;

export const RunItemMeta = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const RunItemDate = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const RunId = styled.span`
    font-size: 10px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
`;

export const RunItemLegend = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.secondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const RunItemInfo = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
`;

export const RunItemArtifact = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const RunItemMetaIcon = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    padding: 1px 5px;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    font-family: ${({ theme }) => theme.font.mono};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const RunItemTrigger = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    white-space: pre;
    color: ${({ theme }) => theme.colors.text.tertiary};

    @media (max-width: 768px) {
        flex-basis: 100%;
    }
`;

export const RunStopButton = styled.button`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.accent.error};
    white-space: nowrap;
    flex-shrink: 0;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: background ${({ theme }) => theme.transition.fast};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
`;

export const RunDetailToggle = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    white-space: nowrap;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        border-color: ${({ theme }) => theme.colors.border.light};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    @media (max-width: 768px) {
        display: none;
    }
`;
