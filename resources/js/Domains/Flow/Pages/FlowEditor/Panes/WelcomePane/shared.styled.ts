import styled from 'styled-components';

export const EditIcon = styled.button`
    display: inline-flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0;
    transition: opacity ${({ theme }) => theme.transition.fast}, color ${({ theme }) => theme.transition.fast};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
    }

    svg { width: 13px; height: 13px; }
`;

export const SectionLabel = styled.h3`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 5px;
`;

export const EmptyText = styled.span`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-style: italic;
`;
