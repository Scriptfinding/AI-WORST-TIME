import styled from 'styled-components';

export const Container = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const Card = styled.div`
    width: 400px;
    max-width: 90vw;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 32px;
`;

export const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
`;

export const BrandIcon = styled.img`
    width: 36px;
    height: 36px;
    border-radius: ${({ theme }) => theme.radius.md};
    object-fit: contain;
`;

export const BrandName = styled.span`
    font-size: 18px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const Title = styled.h1`
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
`;

export const Subtitle = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 24px;
`;

export const Footer = styled.div`
    margin-top: 20px;
    text-align: center;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};

    a {
        color: ${({ theme }) => theme.colors.brand};
        font-weight: 500;

        &:hover {
            color: ${({ theme }) => theme.colors.brandHover};
        }
    }
`;
