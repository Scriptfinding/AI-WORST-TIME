import styled from 'styled-components';

export const Wrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const Body = styled.div`
    flex: 1;
    padding: 0 32px 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    @media (max-width: 768px) {
        padding: 0 16px 24px;
    }
`;
