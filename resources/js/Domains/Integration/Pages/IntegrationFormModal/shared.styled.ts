import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 8px;
`;

export const DocLink = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.primary};
    text-decoration: none;
    padding: 6px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}08;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}20;
    transition: background 150ms, border-color 150ms;

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}14;
        border-color: ${({ theme }) => theme.colors.accent.primary}40;
    }

    svg {
        flex-shrink: 0;
    }
`;

export const GuideLink = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.primary};
    background: ${({ theme }) => theme.colors.accent.primary}08;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}20;
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 6px 10px;
    cursor: pointer;
    transition: background 150ms, border-color 150ms;

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}14;
        border-color: ${({ theme }) => theme.colors.accent.primary}40;
    }

    svg {
        flex-shrink: 0;
    }
`;

export const GuideSteps = styled.ol`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0 0 0 20px;
    font-size: 13px;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.text.secondary};

    li {
        padding-left: 4px;
    }

    li::marker {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-weight: 600;
        font-size: 12px;
    }

    a {
        color: ${({ theme }) => theme.colors.accent.primary};
        text-decoration: none;
        &:hover { text-decoration: underline; }
    }

    code {
        font-size: 11.5px;
        padding: 1px 5px;
        border-radius: 4px;
        background: ${({ theme }) => theme.colors.bg.tertiary};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-weight: 600;
    }
`;
