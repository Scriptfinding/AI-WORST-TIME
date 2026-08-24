import styled from 'styled-components';

export const Page = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 60px;
`;

export const LimitMessage = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.5;
`;
