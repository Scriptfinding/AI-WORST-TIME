import styled from 'styled-components';

export const FormRow = styled.div`
    position: relative;
    width: 100%;
`;

export const KeyValueRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    align-items: start;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

export const FieldKeyInput = styled.input`
    width: 100%;
    min-width: 0;
    flex: 1;
    height: 30px;
    margin-top: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    box-sizing: border-box;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    line-height: 30px;
    font-weight: 600;
    background: transparent;
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const CustomFieldHeader = styled.div`
    flex: 1;
    width: 100%;
    min-width: 0;
    min-height: 30px;
    display: flex;
    align-items: center;
    gap: 8px;
`;
