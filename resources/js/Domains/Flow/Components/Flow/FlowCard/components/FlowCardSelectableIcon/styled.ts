import styled from 'styled-components';

export const Wrapper = styled.span<{ $size: number }>`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    flex-shrink: 0;
`;

export const IconWrapper = styled.span<{ $selected?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: ${({ $selected }) => $selected ? 0 : 1};
    transform: ${({ $selected }) => $selected ? 'scale(0.72)' : 'scale(1)'};
    transition: opacity 140ms ease, transform 140ms ease;
`;

export const Checkbox = styled.button<{ $selected?: boolean }>`
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
