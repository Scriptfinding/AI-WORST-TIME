import styled from 'styled-components';

export const TypePickerLayout = styled.div`
    display: flex;
    gap: 10px;
`;

export const TypePickerCard = styled.button`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 20px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    color: ${({ theme }) => theme.colors.text.secondary};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.accent.primary}08;
        color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const TypePickerLabel = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: inherit;
`;

export const TypePickerDesc = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
    line-height: 1.4;
`;
