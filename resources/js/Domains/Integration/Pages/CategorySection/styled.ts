import styled from 'styled-components';

export const Section = styled.section`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

export const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}12;
    color: ${({ theme }) => theme.colors.accent.primary};
`;

export const Title = styled.h2`
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const Description = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-left: 36px;
    margin-top: -8px;
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
`;
