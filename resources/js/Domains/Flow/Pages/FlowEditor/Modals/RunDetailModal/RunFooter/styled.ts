import styled from 'styled-components';

export const RunDetailFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
    }
`;

export const RunDetailMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
    flex-shrink: 0;
`;

export const RunNavigation = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 2px;
`;

export const RunNavigationButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: transparent;
    color: ${({ theme }) => theme.colors.text.secondary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    &:disabled {
        opacity: 0.35;
        cursor: default;
    }
`;

export const RunDetailMetaItem = styled.span`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: inline-flex;
    align-items: center;
    gap: 3px;
`;
