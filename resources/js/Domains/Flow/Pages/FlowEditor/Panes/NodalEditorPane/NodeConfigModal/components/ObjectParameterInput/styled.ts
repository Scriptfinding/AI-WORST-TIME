import styled from 'styled-components';

export const ObjectField = styled.div<{ $invalid?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme, $invalid }) => ($invalid ? '#ef4444' : theme.colors.border.default)};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ $invalid }) => ($invalid ? '0 0 0 2px #ef444426' : 'none')};
`;

export const ObjectFieldHeader = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;

    > div:first-child {
        flex: 1;
        min-width: 0;
    }

    label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text.primary};
        text-transform: capitalize;
    }

`;

export const ObjectFieldLabelLine = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-bottom: 3px;

    @media (max-width: 640px) {
        flex-wrap: wrap;
    }
`;

export const ObjectInlineRemoveButton = styled.button`
    width: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 1px;
    padding: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    border: 0;
    cursor: pointer;
    flex-shrink: 0;

    &:hover:not(:disabled) {
        color: #ef4444;
    }

    &:disabled {
        cursor: default;
        opacity: 0.45;
    }

    @media (max-width: 640px) {
        order: 2;
        width: 100%;
        height: 34px;
        margin-top: 6px;
        margin-bottom: 16px;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        border-radius: ${({ theme }) => theme.radius.sm};
        background: ${({ theme }) => theme.colors.bg.primary};
    }
`;

export const ObjectInlineRemoveButtonLabel = styled.span`
    display: none;

    @media (max-width: 640px) {
        display: inline;
        font-size: 12px;
        font-weight: 600;
    }
`;

export const ObjectFormRows = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;
