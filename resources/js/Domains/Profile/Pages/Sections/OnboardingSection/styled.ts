import styled from 'styled-components';

export const Card = styled.section`
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
        radial-gradient(circle at 8% 10%, color-mix(in srgb, ${({ theme }) => theme.colors.accent.primary} 12%, transparent), transparent 28%),
        ${({ theme }) => theme.colors.bg.secondary};

    @media (max-width: 640px) {
        grid-template-columns: auto minmax(0, 1fr);

        > button {
            grid-column: 1 / -1;
            width: 100%;
        }
    }
`;

export const Visual = styled.div`
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.accent.primary} 30%, transparent);
    border-radius: 15px;
    background: color-mix(in srgb, ${({ theme }) => theme.colors.accent.primary} 12%, transparent);
    color: ${({ theme }) => theme.colors.accent.primary};
    transform: rotate(-4deg);
`;

export const Content = styled.div`
    min-width: 0;
`;

export const Title = styled.h2`
    margin: 0 0 4px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 600;
`;

export const Description = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    line-height: 1.5;
`;
