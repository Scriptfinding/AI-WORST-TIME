import styled from 'styled-components';

export const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Title = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    span {
        display: block;
        margin-top: 2px;
        font-size: 10px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }
`;

export const TitleInput = styled.input`
    display: block;
    width: min(360px, 50vw);
    min-width: 120px;
    margin: -2px -4px 0;
    padding: 2px 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    background: transparent;
    font-size: 15px;
    font-weight: 700;
    outline: none;

    &:hover:not(:disabled),
    &:focus:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.primary};
    }

    &:disabled {
        opacity: 1;
    }
`;

export const TitleIcon = styled.div<{ $color?: string }>`
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
    background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}18;
    flex-shrink: 0;
`;

export const CloseButton = styled.button`
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const CurrentSite = styled.a<{ $available: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 8px 18px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ $available, theme }) => ($available ? theme.colors.accent.primary : theme.colors.text.tertiary)};
    background: ${({ $available, theme }) => ($available ? `${theme.colors.accent.primary}12` : theme.colors.bg.primary)};
    text-decoration: none;
    cursor: ${({ $available }) => ($available ? 'pointer' : 'default')};
    transition: color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    span {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: ${({ theme }) => theme.colors.text.tertiary};
        flex-shrink: 0;
    }

    strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 700;
    }

    &:hover {
        color: ${({ $available, theme }) => ($available ? theme.colors.accent.primary : theme.colors.text.tertiary)};
        background: ${({ $available, theme }) => ($available ? `${theme.colors.accent.primary}18` : theme.colors.bg.primary)};
    }
`;
