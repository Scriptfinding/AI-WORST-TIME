import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 360px;
    width: 100%;
    padding: 32px;
`;

export const Card = styled.div`
    width: min(100%, 560px);
    padding: 28px 32px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
    text-align: center;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
`;

export const Message = styled.div`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 15px;
    line-height: 1.6;

    p {
        margin: 0;
    }

    p + p {
        margin-top: 10px;
    }

    strong {
        font-weight: 700;
    }

    em {
        font-style: italic;
    }

    a {
        color: ${({ theme }) => theme.colors.accent.primary};
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    img {
        display: block;
        max-width: 100%;
        max-height: 220px;
        width: auto;
        height: auto;
        margin: 14px auto 0;
        border-radius: ${({ theme }) => theme.radius.md};
        border: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;
