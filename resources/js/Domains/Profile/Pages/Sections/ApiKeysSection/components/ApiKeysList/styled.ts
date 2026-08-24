import styled from 'styled-components';

export const SearchWrapper = styled.div`
    position: relative;
    margin-bottom: 12px;

    > svg {
        position: absolute;
        top: 50%;
        left: 10px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        pointer-events: none;
        transform: translateY(-50%);
    }
`;

export const SearchInput = styled.input`
    width: 100%;
    min-width: 0;
    padding: 8px 12px 8px 32px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    outline: none;
    font-size: 12px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const TableWrapper = styled.div`
    width: 100%;
    min-width: 0;
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    min-width: 680px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-spacing: 0;
    border-collapse: separate;
    border-radius: ${({ theme }) => theme.radius.lg};
`;

export const Th = styled.th<{ $right?: boolean }>`
    padding: 10px 14px;
    text-align: ${({ $right }) => $right ? 'right' : 'left'};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;

    &:first-child {
        border-top-left-radius: ${({ theme }) => theme.radius.lg};
    }

    &:last-child {
        border-top-right-radius: ${({ theme }) => theme.radius.lg};
    }
`;

export const Td = styled.td<{ $right?: boolean }>`
    padding: 8px 14px;
    text-align: ${({ $right }) => $right ? 'right' : 'left'};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    font-size: 13px;
    white-space: nowrap;

    tr:last-child & {
        border-bottom: none;
    }

    tr:last-child &:first-child {
        border-bottom-left-radius: ${({ theme }) => theme.radius.lg};
    }

    tr:last-child &:last-child {
        border-bottom-right-radius: ${({ theme }) => theme.radius.lg};
    }
`;

export const KeyName = styled.span`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    display: inline-flex;
    align-items: center;
    gap: 10px;
`;

export const KeyIcon = styled.span`
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accent.primary};
    background: ${({ theme }) => theme.colors.accent.primary}12;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}28;
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const KeyPreview = styled.span`
    display: inline-flex;
    padding: 2px 7px;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.mode === 'dark' ? theme.colors.bg.tertiary : theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    font-weight: 400;
    font-family: ${({ theme }) => theme.font.mono};
`;

export const DateBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 6px;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.mode === 'dark' ? theme.colors.bg.tertiary : theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;

    svg {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const NeverUsed = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;

export const DeleteButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border: none;
    background: none;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    margin-left: auto;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Empty = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
    padding: 28px 0;
    margin: 0;
`;
