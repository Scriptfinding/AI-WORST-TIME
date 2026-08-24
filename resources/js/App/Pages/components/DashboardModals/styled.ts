import styled from 'styled-components';

export const RunActionButton = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    flex-shrink: 0;
    min-height: 30px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;
