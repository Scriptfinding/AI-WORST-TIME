import styled from 'styled-components';

export const JsonLine = styled.div<{ $depth?: number }>`
    display: flex;
    align-items: center;
    width: max-content;
    min-width: max-content;
    padding-left: ${({ $depth = 0 }) => 10 + $depth * 16}px;
    padding-right: 10px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Toggle = styled.button`
    width: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    border-radius: ${({ theme }) => theme.radius.xs};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const TogglePlaceholder = styled.span`
    display: inline-block;
    width: 16px;
`;

export const Summary = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-style: italic;
`;

export const Punctuation = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const TruncatedLine = styled(JsonLine)`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-style: italic;
`;
