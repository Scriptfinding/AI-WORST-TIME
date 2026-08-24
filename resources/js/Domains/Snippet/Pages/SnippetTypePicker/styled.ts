import styled from 'styled-components';

export const Options = styled.div`
    display: flex;
    gap: 12px;

    @media (max-width: 560px) {
        flex-direction: column;
    }
`;

export const Card = styled.button`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    padding: 24px 16px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.accent.primary}08;
        color: ${({ theme }) => theme.colors.accent.primary};
        transform: translateY(-1px);
    }
`;

export const Label = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: inherit;
`;

export const Description = styled.span`
    max-width: 180px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    line-height: 1.45;
    text-align: center;
`;
