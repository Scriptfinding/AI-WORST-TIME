import styled from 'styled-components';

export const LicenseForm = styled.form`
    display: grid;
    gap: 10px;
`;

export const LicenseFilePanel = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 14px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
`;

export const LicenseFileIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.accent.primary};
`;

export const LicenseFileInfo = styled.div`
    display: grid;
    gap: 3px;
    min-width: 0;
`;

export const LicenseFileName = styled.span`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const LicenseFileLink = styled.a`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
        text-decoration: underline;
    }
`;

export const LicenseFileMeta = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;

export const LicenseDropZone = styled.label<{ $dragging?: boolean; $hasFile?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 96px;
    padding: 16px;
    border: 1px dashed ${({ theme, $dragging, $hasFile }) =>
        $dragging || $hasFile ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme, $dragging }) => $dragging ? `${theme.colors.accent.primary}10` : theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    text-align: center;
    transition: border-color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const LicenseDropTitle = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
    word-break: break-all;
`;

export const LicenseDropHint = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;

export const HiddenFileInput = styled.input`
    display: none;
`;

export const LicenseActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
`;

export const LicenseDangerButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    padding: 5px 12px;
    border: 1px solid rgba(239, 68, 68, 0.35);
    border-radius: ${({ theme }) => theme.radius.md};
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;

    &:hover {
        background: rgba(239, 68, 68, 0.18);
    }
`;
