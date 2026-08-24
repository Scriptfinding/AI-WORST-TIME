import styled from 'styled-components';

export const Tooltip = styled.div`
    position: fixed;
    z-index: 900;
    max-width: 260px;
    padding: 7px 9px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
    pointer-events: none;
    white-space: normal;

    &::before {
        content: '';
        position: absolute;
        top: -5px;
        left: 12px;
        width: 10px;
        height: 10px;
        background: ${({ theme }) => theme.colors.bg.primary};
        border-left: 1px solid ${({ theme }) => theme.colors.border.default};
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
        transform: rotate(45deg);
    }
`;
