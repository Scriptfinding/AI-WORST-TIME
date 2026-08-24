import styled from 'styled-components';

export const DropdownWrapper = styled.div`
    position: relative;
`;

export const DropdownTrigger = styled.button<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    font-size: 13px;
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    min-width: 160px;
    white-space: nowrap;

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    svg:last-child {
        margin-left: auto;
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        transition: transform 150ms ease;
        transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
    }
`;

export const DropdownPanel = styled.div<{ $shadow?: string }>`
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 220px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme, $shadow }) => $shadow ?? theme.shadow.lg};
    z-index: 100;
    overflow: hidden;
    animation: dropIn 120ms ease;

    @keyframes dropIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

export const DropdownSearchWrapper = styled.div`
    padding: 6px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const DropdownSearchInput = styled.input`
    width: 100%;
    padding: 6px 8px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const DropdownList = styled.div`
    max-height: 220px;
    overflow-y: auto;
    padding: 4px;
`;

export const DropdownEmpty = styled.div`
    padding: 12px 10px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;

export const DropdownSeparator = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.colors.border.default};
    margin: 4px 0;
`;

export const DropdownSectionLabel = styled.div`
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 4px 10px 2px;
`;
