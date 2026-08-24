import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
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

export const ModalFooter = styled.div`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;
