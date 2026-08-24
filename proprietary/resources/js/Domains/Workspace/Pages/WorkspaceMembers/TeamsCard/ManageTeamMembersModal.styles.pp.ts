import styled from 'styled-components';

export const AddMemberWrapper = styled.div`
    position: relative;
    width: 100%;
    min-width: 0;
    margin-bottom: 8px;
`;

export const AddMemberTrigger = styled.button<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-width: 0;
    padding: 8px 12px;
    font-size: 13px;
    text-align: left;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;

export const AddMemberDropdown = styled.div`
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

export const AddMemberSearch = styled.input`
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

export const PickerList = styled.div`
    display: flex;
    flex-direction: column;
    padding: 4px 0;
    max-height: 200px;
    overflow-y: auto;
`;

export const PickerItem = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    min-width: 0;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    text-align: left;
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;

export const PickerEmpty = styled.div`
    padding: 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;

export const MemberName = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const MemberChip = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    min-width: 0;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.primary};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const RemoveButton = styled.button`
    display: inline-flex;
    align-items: center;
    margin-left: auto;
    padding: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.accent.errorBg};
    }
`;

export const CurrentMembers = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 12px;
    min-width: 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    padding-top: 12px;
`;

export const SectionLabel = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 4px;
`;
