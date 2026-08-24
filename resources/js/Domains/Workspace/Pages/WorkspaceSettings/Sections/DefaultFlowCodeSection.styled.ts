import styled, { css } from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    min-width: 0;
`;

export const FieldHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -5px;
    line-height: 1.4;
`;

export const ModeRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
`;

export const ModeToggle = styled.div`
    display: inline-flex;
    gap: 3px;
    padding: 3px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const ModeOption = styled.button<{ $active: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 13px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: color 150ms, background 150ms, box-shadow 150ms;

    ${({ $active, theme }) => $active
        ? css`
            color: white;
            background: ${theme.colors.accent.primary};
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
        `
        : css`
            color: ${theme.colors.text.secondary};
            background: transparent;

            &:hover {
                color: ${theme.colors.text.primary};
                background: ${theme.colors.bg.hover};
            }
        `}
`;

export const EditorLabel = styled.label`
    font-size: 13px;
    font-weight: 500;
`;

export const CodeEditorShell = styled.div`
    position: relative;
`;

export const CodeEditor = styled.div`
    height: 420px;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};

`;

export const VisualEditor = styled.div`
    display: flex;
    height: min(640px, calc(100vh - 180px));
    min-height: 480px;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const FormActions = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
`;
