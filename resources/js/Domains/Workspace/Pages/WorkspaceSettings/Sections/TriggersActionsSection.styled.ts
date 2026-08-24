import styled from 'styled-components';

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
`;

export const FieldHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -5px;
    line-height: 1.4;
`;
