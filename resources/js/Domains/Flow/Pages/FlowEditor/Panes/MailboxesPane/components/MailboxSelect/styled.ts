import styled from 'styled-components';

export const SelectWrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;
`;

export const DropdownTrigger = styled.button<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 13px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    border-radius: 6px;
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    &:focus { border-color: ${({ theme }) => theme.colors.border.focus}; }
`;

export const DropdownPanel = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin-top: 4px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    max-height: 260px;
    display: flex;
    flex-direction: column;
`;

export const SearchRow = styled.div`
    display: flex;
    align-items: center;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};

    input {
        min-width: 0;
        flex: 1;
        padding: 8px 9px;
        border-bottom: 0;
        font-size: 12px;
    }
`;

export const RefreshButton = styled.button`
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: wait;
        opacity: 0.6;
    }
`;

export const CreateAction = styled.button`
    width: 100%;
    flex-shrink: 0;
    padding: 8px 9px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;
