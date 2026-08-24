import styled from 'styled-components';
import { checkboxStyles } from '@/Shared/UI/Checkbox/styles';

export const Card = styled.div`
    min-width: 0;
    max-width: 100%;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 20px 24px;
`;

export const CardTitle = styled.h2`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const TableWrapper = styled.div`
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    min-width: 640px;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};

    th {
        padding: 10px 14px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 11px;
        font-weight: 600;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }

    thead th:first-child {
        border-top-left-radius: ${({ theme }) => theme.radius.lg};
    }

    thead th:last-child {
        border-top-right-radius: ${({ theme }) => theme.radius.lg};
    }

    th.center,
    td.center {
        text-align: center;
    }

    td {
        padding: 8px 14px;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 13px;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        white-space: nowrap;
        background: ${({ theme }) => theme.colors.bg.primary};
    }

    tbody tr:last-child > td {
        border-bottom: 0;
    }

    tbody tr:last-child > td:first-child {
        border-bottom-left-radius: ${({ theme }) => theme.radius.lg};
    }

    tbody tr:last-child > td:last-child {
        border-bottom-right-radius: ${({ theme }) => theme.radius.lg};
    }
`;

export const TableActions = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    position: relative;
`;

export const TableEmailLink = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 240px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        text-decoration: underline;
    }
`;

export const TableDateBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.mode === 'dark' ? theme.colors.bg.tertiary : theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const BoolCell = styled.span<{ $yes?: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: ${({ theme, $yes }) => $yes ? theme.colors.accent.success : theme.colors.text.tertiary};

    svg {
        flex-shrink: 0;
    }
`;

export const SelectWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
`;

export const Label = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Select = styled.select`
    width: 100%;
    padding: 8px 12px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const ErrorText = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.accent.error};
    margin-top: -4px;
`;

export const CheckboxRow = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;

    input[type="checkbox"] {
        ${checkboxStyles}
    }

    label {
        cursor: pointer;
    }
`;

export const OverflowWrapper = styled.div`
    position: relative;
`;

export const OverflowButton = styled.button`
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const OverflowMenu = styled.div`
    position: fixed;
    z-index: 1000;
    min-width: 120px;
    padding: 4px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.md};
`;

export const OverflowMenuItem = styled.button<{ $danger?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    font-size: 12px;
    white-space: nowrap;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.secondary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ $danger, theme }) => $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
        color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;

        &:hover {
            background: transparent;
        }
    }
`;
