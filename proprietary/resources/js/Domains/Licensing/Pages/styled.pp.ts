import styled from 'styled-components';

export const Panel = styled.div`
    display: grid;
    gap: 14px;
`;

export const StatusRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    padding-bottom: 10px;

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        text-align: right;
        word-break: break-all;
    }
`;

export const StatusBadge = styled.span<{ $active?: boolean }>`
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ $active }) => $active ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.12)'};
    color: ${({ $active }) => $active ? '#16a34a' : '#f59e0b'};
    font-size: 12px;
    font-weight: 700;
    padding: 4px 9px;
`;

export const Form = styled.form`
    display: grid;
    gap: 12px;
    margin-top: 8px;
`;

export const Divider = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;

    &::before,
    &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: ${({ theme }) => theme.colors.border.default};
    }
`;

export const DropZone = styled.label<{ $dragging?: boolean; $hasFile?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 110px;
    padding: 18px;
    border: 1px dashed ${({ theme, $dragging, $hasFile }) =>
        $dragging || $hasFile ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme, $dragging }) => $dragging ? `${theme.colors.accent.primary}10` : theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    text-align: center;
    transition: border-color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const DropTitle = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    word-break: break-all;
`;

export const DropHint = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const HiddenFileInput = styled.input`
    display: none;
`;

export const FieldError = styled.div`
    color: #ef4444;
    font-size: 12px;
    font-weight: 600;
`;

export const Flash = styled.div<{ $variant: 'success' | 'error' }>`
    border: 1px solid ${({ $variant }) => $variant === 'success' ? 'rgba(22, 163, 74, 0.35)' : 'rgba(239, 68, 68, 0.35)'};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ $variant }) => $variant === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
    color: ${({ $variant }) => $variant === 'success' ? '#16a34a' : '#ef4444'};
    font-size: 13px;
    font-weight: 600;
    padding: 10px 12px;
    min-width: 0;
    overflow-wrap: anywhere;
`;
