import styled from 'styled-components';

export const GroupLabel = styled.button<{ $depth: number }>`
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 6px 14px;
    padding-left: ${({ $depth }) => 14 + $depth * 14}px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: none;
    text-align: left;
    cursor: pointer;
    position: sticky;
    top: 0;
    z-index: 1;

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    svg {
        flex-shrink: 0;
    }
`;

export const GroupCount = styled.span`
    margin-left: auto;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.8;
`;
