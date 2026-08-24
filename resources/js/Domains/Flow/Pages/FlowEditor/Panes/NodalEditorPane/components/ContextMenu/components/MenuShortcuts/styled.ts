import styled from 'styled-components';

export const Group = styled.div`
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
`;

export const KeyCombo = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-family: ${({ theme }) => theme.font.mono};
    line-height: 1;
`;

export const CompactKeyCombo = styled(KeyCombo)`
    gap: 2px;
`;

export const Modifier = styled.div`
    font-size: 16px;
`;

export const Key = styled.div`
    font-size: 13px;
`;

export const Separator = styled.div`
    font-size: 11px;
`;

export const MouseShortcut = styled.span`
    position: relative;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0 !important;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 10px;

    svg {
        width: 15px;
        height: 15px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        stroke-width: 1.8;
        display: block;
    }

    b {
        font-weight: 700;
    }

    .shortcut-key {
        font-size: 13px;
        font-weight: 400;
        line-height: 1;
    }
`;

export const MouseLeftClickDot = styled.span`
    position: absolute;
    left: 3px;
    top: 2px;
    width: 5px;
    height: 6px;
    border-radius: 5px 0 0 2px;
    background: ${({ theme }) => theme.colors.text.tertiary}88;
`;
