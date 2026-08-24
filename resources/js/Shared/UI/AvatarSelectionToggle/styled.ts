import styled from 'styled-components';

export const Label = styled.label`
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    cursor: pointer;
`;

export const Input = styled.input`
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
`;

export const Frame = styled.span<{ $size: number; $selected: boolean }>`
    position: relative;
    display: inline-flex;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: ${({ theme, $selected }) => $selected ? theme.radius.md : '50%'};
    transition:
        border-radius ${({ theme }) => theme.transition.fast},
        transform ${({ theme }) => theme.transition.fast};

    ${Label}:hover & {
        border-radius: ${({ theme }) => theme.radius.md};
        transform: scale(1.04);
    }

    ${Input}:focus-visible + & {
        outline: 2px solid ${({ theme }) => theme.colors.border.focus};
        outline-offset: 2px;
    }
`;

export const Avatar = styled.span<{ $selected: boolean }>`
    display: inline-flex;
    opacity: ${({ $selected }) => $selected ? 0 : 1};
    transform: ${({ $selected }) => $selected ? 'scale(0.78)' : 'scale(1)'};
    transition:
        opacity ${({ theme }) => theme.transition.fast},
        transform ${({ theme }) => theme.transition.fast};

    ${Label}:hover & {
        opacity: 0;
        transform: scale(0.78);
    }
`;

export const Checkbox = styled.span<{ $selected: boolean }>`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid ${({ theme, $selected }) =>
        $selected ? theme.colors.accent.primary : theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme, $selected }) =>
        $selected ? theme.colors.accent.primary : theme.colors.bg.primary};
    color: white;
    box-shadow: ${({ theme, $selected }) => $selected ? `0 2px 8px ${theme.colors.accent.primary}45` : theme.shadow.sm};
    opacity: ${({ $selected }) => $selected ? 1 : 0};
    transform: ${({ $selected }) => $selected ? 'scale(1)' : 'scale(0.78)'};
    transition:
        opacity ${({ theme }) => theme.transition.fast},
        transform ${({ theme }) => theme.transition.fast},
        background ${({ theme }) => theme.transition.fast},
        border-color ${({ theme }) => theme.transition.fast};

    ${Label}:hover & {
        opacity: 1;
        transform: scale(1);
    }
`;
