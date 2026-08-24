import styled from 'styled-components';

export const RuleGroupWrap = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 8px;
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const RuleGroupHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
`;

export const RuleGroupLabel = styled.span`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const RuleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
`;

export const RuleSelect = styled.select`
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
`;

export const RuleInput = styled.input`
    flex: 1.5;
    min-width: 0;
    padding: 6px 8px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const RuleRemoveBtn = styled.button`
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.tertiary};
    border-radius: 4px;
    display: flex;
    align-items: center;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;

export const AddRuleBtn = styled.button`
    background: none;
    border: none;
    padding: 4px 0;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
        text-decoration: underline;
    }
`;

export const OrDivider = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.text.tertiary};

    &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: ${({ theme }) => theme.colors.border.default};
    }
`;
