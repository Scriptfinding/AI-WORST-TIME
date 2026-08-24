import styled, { css } from 'styled-components';

export const RunItem = styled.div<{ $selected?: boolean; $selectionActive?: boolean; $selectable?: boolean }>`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 13px;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast}, box-shadow ${({ theme }) => theme.transition.fast};
    box-shadow: ${({ theme, $selected }) => $selected ? `0 0 0 3px ${theme.colors.accent.primary}18` : 'none'};

    &:hover {
        border-color: ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.border.light};
    }

    ${({ $selectable }) => $selectable && css`
        &:hover [data-select-checkbox] {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        &:hover [data-select-icon] {
            opacity: 0;
            transform: scale(0.72);
        }
    `}

    ${({ $selected, $selectionActive, $selectable }) => $selectable && ($selected || $selectionActive) && css`
        [data-select-checkbox] {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        [data-select-icon] {
            opacity: 0;
            transform: scale(0.72);
        }
    `}

    @media (max-width: 768px) {
        flex-wrap: wrap;
    }
`;

export const RunId = styled.span`
    font-size: 11px;
    justify-content: flex-start;
    align-items: center;
    display: flex;
    font-family: ${({ theme }) => theme.font.mono};
    color: ${({ theme }) => theme.colors.text.tertiary};
    min-width: 7ch;
    flex-shrink: 0;
`;

export const SelectableStatusWrapper = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    flex-shrink: 0;
`;

export const SelectableStatusIcon = styled.span.attrs<{ 'data-select-icon'?: string }>({ 'data-select-icon': '' })<{ $selected?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: ${({ $selected }) => $selected ? 0 : 1};
    transform: ${({ $selected }) => $selected ? 'scale(0.72)' : 'scale(1)'};
    transition: opacity 140ms ease, transform 140ms ease;

    > span {
        min-height: 22px;
        min-width: 30px;
        justify-content: center;
    }
`;

export const SelectCheckbox = styled.button.attrs<{ 'data-select-checkbox'?: string }>({ 'data-select-checkbox': '' })<{ $selected?: boolean }>`
    position: absolute;
    inset: 50% auto auto 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.border.light};
    background: ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.bg.secondary};
    color: white;
    box-shadow: ${({ theme }) => theme.shadow.md};
    cursor: pointer;
    opacity: ${({ $selected }) => $selected ? 1 : 0};
    transform: translate(-50%, -50%) scale(${({ $selected }) => $selected ? 1 : 0.82});
    transition: opacity 140ms ease, transform 140ms ease, border-color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.bg.tertiary};
    }
`;

export const RunMain = styled.span`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 12px;
    flex: 1;
    align-self: stretch;
    flex-wrap: wrap;
    min-width: 0;
`;

export const RunFlow = styled.span`
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
`;

export const RunFlowName = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const RunLegendSeparator = styled.span`
    color: ${({ theme }) => theme.colors.border.light};
    font-weight: 300;
    flex-shrink: 0;
`;

export const RunLegend = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1;
    align-self: stretch;
    display: flex;
    justify-content: flex-start;
    align-items: center;
`;

export const RunMeta = styled.span`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;

    @media (max-width: 768px) {
        width: 100%;
    }
`;

export const RunMetaItem = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    white-space: nowrap;
`;

export const ArtifactGroup = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 8px;
`;

export const WaitingHumanIcon = styled.span`
    display: inline-flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.accent.info};
    flex-shrink: 0;
`;

export const MetaPopoverAnchor = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
`;

export const MetaButton = styled.button`
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

export const MetaPopover = styled.div`
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    min-width: 200px;
    max-width: min(500px, 90vw);
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    user-select: text;
    cursor: default;
`;

export const MetaPopoverTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-radius: ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0 0;
`;

export const MetaPopoverBody = styled.div`
    padding: 6px 0;
    max-height: 200px;
    overflow-y: auto;
`;

export const MetaPopoverRow = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 3px 10px;
    font-size: 11px;

    &:nth-child(even) {
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const MetaPopoverKey = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    flex-shrink: 0;
    white-space: nowrap;
`;

export const MetaPopoverValue = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};
    text-align: right;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    a {
        color: ${({ theme }) => theme.colors.accent.primary};
        text-decoration: underline;
        cursor: pointer;

        &:hover {
            opacity: 0.8;
        }
    }
`;

export const RunActionButton = styled.a`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-decoration: none;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const StopButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.accent.error};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.error}12;
    }
`;
