import styled from 'styled-components';

export const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const FieldLabel = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const SelectWrapper = styled.div`
    position: relative;
`;

export const SelectTrigger = styled.button<{ $hasValue?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme, $hasValue }) => $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary};
    cursor: pointer;
    transition: border-color 150ms;
    text-align: left;

    &:hover, &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const TriggerContent = styled.span`
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const SelectDropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin-top: 4px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    overflow: hidden;
`;

export const SelectItem = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    text-align: left;
    padding: 8px 10px;
    font-size: 12px;
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.primary};
    background: ${({ theme, $active }) => $active ? theme.colors.accent.primary + '10' : 'transparent'};
    font-weight: ${({ $active }) => $active ? 600 : 400};
    cursor: pointer;
    border: none;
    transition: background 100ms;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;
