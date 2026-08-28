import styled from 'styled-components';

export const DropdownWrapper = styled.div`
    position: relative;
`;

export const DropdownTrigger = styled.button<{ $open?: boolean; $iconOnly?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: ${({ $iconOnly }) => $iconOnly ? '5px 6px' : '7px 10px'};
    font-size: ${({ $iconOnly }) => $iconOnly ? '11px' : '13px'};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme, $iconOnly }) => $iconOnly ? theme.radius.sm : theme.radius.md};
    background: ${({ theme, $iconOnly }) => $iconOnly ? theme.colors.bg.secondary : theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    box-sizing: border-box;
    min-width: ${({ $iconOnly }) => $iconOnly ? '26px' : '160px'};
    width: ${({ $iconOnly }) => $iconOnly ? '26px' : 'auto'};
    height: ${({ $iconOnly }) => $iconOnly ? '26px' : 'auto'};
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

export const DropdownPanel = styled.div<{ $shadow?: string; $align?: 'left' | 'right' }>`
    position: absolute;
    top: calc(100% + 4px);
    ${({ $align = 'right' }) => $align === 'left' ? 'left: 0;' : 'right: 0;'}
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
