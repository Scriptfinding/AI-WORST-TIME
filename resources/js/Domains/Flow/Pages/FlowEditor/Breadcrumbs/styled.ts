import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    min-width: 0;

    @media (max-width: 768px) {
        white-space: nowrap;
        font-size: 13px;
    }
`;

export const Sep = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        &:not(:last-of-type) {
            display: none;
        }
    }
`;
