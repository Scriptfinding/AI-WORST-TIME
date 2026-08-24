import styled from 'styled-components';

export const ExpressionExpandButton = styled.button`
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.primary};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: default;
        opacity: 0.55;
    }
`;

export const ExpressionModeToggle = styled.div`
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const ExpressionModeButton = styled.button<{ $active?: boolean }>`
    padding: 3px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 10px;
    font-weight: 600;
    color: ${({ theme, $active }) => ($active ? theme.colors.text.primary : theme.colors.text.tertiary)};
    background: ${({ theme, $active }) => ($active ? theme.colors.bg.hover : 'transparent')};
    cursor: pointer;

    &:disabled {
        cursor: default;
        opacity: 0.55;
    }
`;

export const VariableDropdown = styled.div`
    z-index: 1025;
    max-height: 260px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.md};
`;

export const VariableSearchRow = styled.div`
    display: flex;
    align-items: center;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const VariableSearch = styled.input`
    min-width: 0;
    flex: 1;
    width: 100%;
    padding: 9px 10px;
    border: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    background: transparent;
    font-size: 12px;
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const VariableRefreshButton = styled.button`
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: wait;
        opacity: 0.6;
    }
`;

export const VariableCreateButton = styled.button`
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 4px;
    padding: 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.brand};
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const VariableList = styled.div`
    min-height: 0;
    overflow-y: auto;
    padding: 0 4px 4px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const VariableItem = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    background: transparent;
    text-align: left;

    &:hover,
    &:focus-visible {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
    }

    span {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 10px;
        text-transform: uppercase;
    }
`;

export const VariableStatus = styled.div`
    padding: 12px 8px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;
