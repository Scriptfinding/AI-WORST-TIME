import styled from 'styled-components';

export const Fields = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const CopyableRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 8px;

    > button {
        margin-bottom: 4px;
    }
`;

export const Hint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
`;
