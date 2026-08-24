import styled from 'styled-components';

export const DropZone = styled.label<{ $dragging?: boolean; $hasError?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 130px;
    padding: 20px;
    border: 1px dashed ${({ theme, $dragging, $hasError }) =>
        $hasError ? theme.colors.accent.error : $dragging ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme, $dragging }) => $dragging ? `${theme.colors.accent.primary}10` : theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    text-align: center;
    transition: border-color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const DropTitle = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const DropHint = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const HiddenFileInput = styled.input`
    display: none;
`;

export const EditorToggle = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 8px;
`;

export const Editor = styled.textarea<{ $hasError?: boolean }>`
    width: 100%;
    min-height: 180px;
    padding: 10px 12px;
    border: 1px solid ${({ theme, $hasError }) => $hasError ? theme.colors.accent.error : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    margin-bottom: 8px;
    resize: vertical;

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;
