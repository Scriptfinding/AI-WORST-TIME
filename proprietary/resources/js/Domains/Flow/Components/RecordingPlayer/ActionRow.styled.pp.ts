import styled, { css } from 'styled-components';

export const ActionRow = styled.div<{
    $active: boolean;
    $past: boolean;
    $color: string;
}>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    min-height: 36px;
    cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
    border-right: 3px solid transparent;

    ${({ $active, $color, theme }) =>
        $active
            ? css`
                  background: ${$color}33;
                  border-right-color: ${$color};
              `
            : css`
                  &:hover {
                      background: ${theme.colors.bg.tertiary};
                  }
              `}

    ${({ $past, $color }) =>
        $past &&
        css`
            border-right-color: ${$color}44;
        `}

    ${({ $active, $past }) =>
        !$active && !$past &&
        css`
            opacity: 0.45;
        `}
`;

export const ActionRowIcon = styled.div<{ $color: string }>`
    width: 22px;
    height: 22px;
    border-radius: 5px;
    background: ${({ $color }) => $color};
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
`;

export const ActionRowBody = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
`;

export const ActionRowName = styled.span`
    font-size: 11.5px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.3;
`;

export const ActionRowLabel = styled.span`
    font-size: 10.5px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const ActionRowTime = styled.span`
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.text.secondary};
    white-space: nowrap;
    margin-top: 3px;
    flex-shrink: 0;
`;
