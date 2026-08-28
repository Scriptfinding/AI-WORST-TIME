import styled from 'styled-components';
import { RunStatusIcon as BaseRunStatusIcon } from '@/Domains/Flow/Pages/FlowEditor/shared/runStatus.styled';

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
    border-radius: inherit;
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;

export const RunItemMeta = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const RunId = styled.span`
    font-size: 10px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
`;

export const RunItemDate = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    display: flex;
    align-items: center;
    gap: 6px;
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

export const CheckboxOverlay = styled.span<{ $checked: boolean }>`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1.5px solid ${({ theme, $checked }) =>
        $checked ? theme.colors.accent.primary : theme.colors.text.tertiary};
    background: ${({ theme, $checked }) =>
        $checked ? theme.colors.accent.primary : 'transparent'};
    color: ${({ $checked }) => $checked ? '#fff' : 'transparent'};
    opacity: ${({ $checked }) => $checked ? 1 : 0};
    transition: opacity 0.12s, background 0.12s, border-color 0.12s;

    svg {
        width: 12px;
        height: 12px;
    }
`;

export const StatusIconInner = styled(BaseRunStatusIcon)<{ $hidden?: boolean }>`
    transition: opacity 0.12s;
    ${({ $hidden }) => $hidden && `opacity: 0;`}
`;

export const StatusCheckboxWrapper = styled.span<{ $checked: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    cursor: pointer;

    &:hover > ${CheckboxOverlay} {
        opacity: 1;
    }

    &:hover > ${StatusIconInner} {
        opacity: 0;
    }
`;

export const RunItemDuration = styled.span`
    font-family: ${({ theme }) => theme.font.mono};
    display: inline-flex;
    align-items: center;
    gap: 2px;
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
