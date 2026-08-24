import styled from 'styled-components';

export const Panel = styled.section`
    min-width: 0;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 20px 24px;
`;

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

export const ToolbarText = styled.div`
    min-width: 0;
`;

export const Title = styled.h2`
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 600;
`;

export const KeyCount = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    font-weight: 400;
`;

export const Description = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin: 0;
    line-height: 1.5;
`;

export const DocsLink = styled.a`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-decoration: none;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary}55;
        background: ${({ theme }) => theme.colors.accent.primary}08;
        color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const DocsLinkContent = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    color: ${({ theme }) => theme.colors.accent.primary};
`;

export const DocsLinkText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const DocsLinkTitle = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const DocsLinkDescription = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
