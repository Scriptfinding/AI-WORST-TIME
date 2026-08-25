import styled from 'styled-components';

export const SelectWrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;
`;

export const SelectLabel = styled.label`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const DropdownTrigger = styled.button<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 13px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};
    text-align: left;
    width: 100%;

    &:focus {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
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
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    overflow: hidden;
`;

export const DropdownSearch = styled.input`
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const DropdownList = styled.ul`
    list-style: none;
    margin: 0;
    padding: 4px 0;
    max-height: 180px;
    overflow-y: auto;
`;

export const DropdownItem = styled.li<{ $active?: boolean }>`
    padding: 7px 12px;
    font-size: 13px;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.tertiary : 'transparent'};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;

export const DropdownEmpty = styled.li`
    padding: 8px 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const NoDomainHint = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 8px 12px;
    background: ${({ theme }) => theme.colors.accent.warningBg};
    border: 1px solid ${({ theme }) => theme.colors.accent.warning}20;
    border-radius: ${({ theme }) => theme.radius.md};

    > span {
        line-height: 1.45;
    }
`;
