import styled from 'styled-components';

export const TreeGroupLabel = styled.div<{ $depth: number }>`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
    padding-left: ${({ $depth }) => $depth > 0 ? `${$depth * 12}px` : 0};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
