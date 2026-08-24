import styled from 'styled-components';

export const Field = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

export const Label = styled.label`
    margin-bottom: 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 500;
`;

export const InputRow = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
`;

export const Input = styled.input`
    flex: 1;
    min-width: 0;
    padding: 4px 6px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &::-webkit-calendar-picker-indicator {
        cursor: pointer;
        opacity: 0.6;
    }
`;

export const Clear = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: none;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.accent.error};
    }
`;
