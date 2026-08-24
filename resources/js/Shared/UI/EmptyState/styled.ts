import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
`;

export const Icon = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 16px;

    svg {
        width: 48px;
        height: 48px;
        opacity: 0.4;
    }
`;

export const Title = styled.h3`
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: 6px;
`;

export const Description = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    max-width: 360px;
    margin-bottom: 20px;
`;
