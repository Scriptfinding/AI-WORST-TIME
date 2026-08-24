import styled from 'styled-components';

export const ClockHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
    margin-top: -8px;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: -2px;
`;
