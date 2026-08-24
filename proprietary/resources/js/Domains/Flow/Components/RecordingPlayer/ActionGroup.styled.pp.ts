import styled from 'styled-components';

export const ActionGroup = styled.div<{ $aiSequence?: boolean; $color?: string }>`
    margin: 4px 6px;
    border-radius: 6px;
    border: 1px solid ${({ theme, $aiSequence, $color }) => $aiSequence ? $color : theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    overflow: hidden;
    ${({ $aiSequence }) => !$aiSequence && 'overflow: hidden;'}
`;

export const SequenceHeader = styled.div<{ $color: string }>`
    min-height: 32px;
    padding: 4px 6px 4px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid ${({ $color }) => $color};
    color: #fff;
    background: ${({ $color }) => $color};
`;

export const SequenceTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
    font-size: 11px;
    font-weight: 700;
`;

export const SequenceMenuWrapper = styled.div`
    position: relative;
    flex-shrink: 0;
`;

export const SequenceMenuButton = styled.button`
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: #fff;
    cursor: pointer;

    &:hover {
        background: rgb(255 255 255 / 14%);
        color: #fff;
    }
`;

export const SequenceMenu = styled.div`
    position: absolute;
    z-index: 30;
    top: calc(100% + 4px);
    right: 0;
    width: 210px;
    padding: 4px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 7px;
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const SequenceMenuItem = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    font: inherit;
    font-size: 11px;
    text-align: left;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;
