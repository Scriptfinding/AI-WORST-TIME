import styled from 'styled-components';

export const FieldHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -5px;
    line-height: 1.4;
`;

export const Divider = styled.div`
    width: 100%;
    border-top: 1px solid var(--pf-border-default);
`;
