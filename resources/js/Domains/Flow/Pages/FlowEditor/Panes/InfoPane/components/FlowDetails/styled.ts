import styled from 'styled-components';

export const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 12px;
    font-size: 12px;
`;

export const InfoLabel = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const InfoValue = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const InfoDateCapsule = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    white-space: nowrap;

    svg {
        width: 10px;
        height: 10px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        flex-shrink: 0;
    }
`;
