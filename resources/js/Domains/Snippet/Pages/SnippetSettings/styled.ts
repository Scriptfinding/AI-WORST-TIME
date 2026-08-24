import styled from 'styled-components';

export const CollapsedPanel = styled.div<{ $mobileHidden?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 40px;
    min-width: 40px;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    padding-top: 10px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        ${({ $mobileHidden }) => $mobileHidden ? 'display: none;' : ''}
    }
`;

export const CollapseBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: none;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const SettingsBody = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

export const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

export const FieldLabel = styled.label`
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const FieldInput = styled.input`
    padding: 7px 10px;
    font-size: 13px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    &:focus { border-color: ${({ theme }) => theme.colors.accent.primary}; }
    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
    &:disabled {
        background: ${({ theme }) => theme.mode === 'dark' ? '#15151a' : theme.colors.bg.tertiary};
        color: ${({ theme }) => theme.colors.text.secondary};
        cursor: not-allowed;
    }
`;

export const FieldTextarea = styled.textarea`
    padding: 7px 10px;
    font-size: 13px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    resize: vertical;
    min-height: 60px;
    &:focus { border-color: ${({ theme }) => theme.colors.accent.primary}; }
    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
`;

export const FieldHint = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;

    code {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 10px;
        padding: 1px 4px;
        border-radius: 3px;
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;
