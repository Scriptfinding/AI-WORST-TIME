import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const Info = styled.p`
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const TextInput = styled.input`
    width: 100%;
    min-width: 0;
    padding: 8px 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    outline: none;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const PasswordWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

export const EyeButton = styled.button`
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Footer = styled.div`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;
