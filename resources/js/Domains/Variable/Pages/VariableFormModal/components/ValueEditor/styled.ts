import styled from 'styled-components';

export const JsonField = styled.div``;

export const Label = styled.label`
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
`;

export const JsonEditorWrapper = styled.div`
    height: 200px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    overflow: hidden;
`;

export const Error = styled.div`
    margin-top: 4px;
    color: var(--accent-error, #ef4444);
    font-size: 12px;
`;

export const Hint = styled.div`
    margin-top: 4px;
    color: var(--text-tertiary, #888);
    font-size: 11px;
`;
