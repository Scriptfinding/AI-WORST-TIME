import styled from 'styled-components';

export const Container = styled.section`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
`;

export const Content = styled.div`
    width: min(100%, 620px);
`;

export const Status = styled.div`
    color: ${({ theme }) => theme.colors.brand};
    font-size: clamp(72px, 13vw, 136px);
    font-weight: 700;
    letter-spacing: -0.075em;
    line-height: 0.85;
`;

export const StatusLabel = styled.span`
    color: ${({ theme }) => theme.mode === 'light' ? '#0a1b3f' : theme.colors.text.secondary};
`;

export const Title = styled.h1`
    margin-top: 28px;
    color: ${({ theme }) => theme.mode === 'light' ? '#0a1b3f' : theme.colors.text.secondary};
    font-size: clamp(34px, 6vw, 52px);
    font-weight: 650;
    letter-spacing: -0.045em;
    line-height: 1.05;
`;

export const Description = styled.p`
    max-width: 420px;
    margin: 20px auto 32px;
    color: ${({ theme }) => theme.mode === 'light' ? '#0a1b3f' : theme.colors.text.secondary};
    font-size: 15px;
    line-height: 1.65;
`;

export const Action = styled.a`
    display: inline-flex;
    min-height: 42px;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 0 18px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.brand};
    color: #ffffff;
    font-size: 14px;
    font-weight: 650;
    text-decoration: none;
    transition:
        background ${({ theme }) => theme.transition.fast},
        transform ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.brandHover};
        transform: translateY(-1px);
    }

    &:focus-visible {
        outline: 3px solid ${({ theme }) => theme.colors.accent.primary}44;
        outline-offset: 3px;
    }

    svg {
        width: 16px;
        height: 16px;
    }
`;
