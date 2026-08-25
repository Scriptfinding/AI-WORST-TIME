import styled, { css } from 'styled-components';

export const Tooltip = styled.div<{ $placement: 'top' | 'right' }>`
    position: fixed;
    z-index: 9999;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: max-content;
    max-width: min(320px, 90vw);
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.elevated};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    line-height: 1.45;

    &::before {
        content: '';
        position: absolute;
        width: 9px;
        height: 9px;
        background: ${({ theme }) => theme.colors.bg.elevated};
    }

    ${({ $placement, theme }) => $placement === 'right'
        ? css`
            transform: translateY(-50%);

            &::before {
                top: 50%;
                left: -5px;
                border-bottom: 1px solid ${theme.colors.border.default};
                border-left: 1px solid ${theme.colors.border.default};
                transform: translateY(-50%) rotate(45deg);
            }
        `
        : css`
            transform: translate(-50%, -100%);

            &::before {
                left: 50%;
                bottom: -5px;
                border-right: 1px solid ${theme.colors.border.default};
                border-bottom: 1px solid ${theme.colors.border.default};
                transform: translateX(-50%) rotate(45deg);
            }
        `}
`;

export const Trigger = styled.div`
    position: relative;
    display: flex;
    flex: 1;
    min-width: 0;

    > button {
        width: 100%;
    }

`;

export const IconWrap = styled.span`
    display: inline-flex;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Message = styled.div`
    min-width: 0;

    p {
        margin: 0;
    }

    a {
        color: ${({ theme }) => theme.colors.accent.primary};
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;
