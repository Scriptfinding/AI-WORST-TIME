import styled from 'styled-components';

export const ModalTitle = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;

    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }
`;

export const TitleSeparator = styled.span`
    color: ${({ theme }) => theme.colors.border.light};
    font-weight: 300;
    margin: 0 -2px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        display: none;
    }
`;

export const TitleLegend = styled.span`
    font-size: 12px;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.text.secondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
`;
