import styled from 'styled-components';

export const FilterBar = styled.div`
    margin-bottom: 22px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
    overflow: visible;

    form {
        display: flex;
        flex-direction: column;
    }
`;

export const FilterBarTop = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-top-left-radius: ${({ theme }) => theme.radius.lg};
    border-top-right-radius: ${({ theme }) => theme.radius.lg};

    @media (max-width: 768px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

export const FilterBarTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const FilterBarBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    min-height: 1px;
`;

export const FilterFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 4px;
`;
