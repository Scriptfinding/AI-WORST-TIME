import styled from 'styled-components';

export const Card = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    overflow: hidden;
    background: ${({ theme }) => theme.colors.bg.primary};
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const Preview = styled.a`
    display: block;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    background: ${({ theme }) => theme.colors.bg.tertiary};
`;

export const Image = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
`;

export const IconPreview = styled.a`
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 10;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Info = styled.div`
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const Name = styled.a`
    display: block;
    overflow: hidden;
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const Path = styled.span`
    overflow: hidden;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 9px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Size = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
