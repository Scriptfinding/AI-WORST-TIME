import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    min-width: 0;
`;

export const Fields = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 640px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const Hint = styled.div`
    margin-top: -5px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.4;
`;

export const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
`;
