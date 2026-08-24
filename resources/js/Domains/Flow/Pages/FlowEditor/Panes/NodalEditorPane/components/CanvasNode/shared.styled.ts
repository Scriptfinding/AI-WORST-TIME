import styled from 'styled-components';

export const NodeHoverButton = styled.button<{ $danger?: boolean }>`
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const NodeHoverMenuWrap = styled.div`
    position: relative;
`;

export const NodeHoverDropdown = styled.div`
    position: absolute;
    top: 24px;
    right: 0;
    min-width: 150px;
    padding: 5px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.md};
    z-index: 10;
`;

export const NodeHoverDropdownItem = styled.button<{ $danger?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;

    span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    kbd {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 10px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-family: ${({ theme }) => theme.font.mono};

        span {
            font-size: 16px;
            line-height: 1;
        }

        b {
            font-size: 13px;
            font-weight: 400;
            line-height: 1;
        }
    }

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;
