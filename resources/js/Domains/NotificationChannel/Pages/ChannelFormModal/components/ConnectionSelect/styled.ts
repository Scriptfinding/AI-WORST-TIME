import styled from 'styled-components';

export const Field = styled.div``;

export const Label = styled.label`
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Select = styled.div`
    position: relative;
    width: 100%;
    margin-top: 4px;
`;

export const Container = styled.div`
    position: relative;
`;

export const Trigger = styled.button<{ $open?: boolean; $hasValue?: boolean }>`
    width: 100%;
    padding: 8px 32px 8px 12px;
    font-size: 13px;
    text-align: left;
    border: 1px solid ${({ $open, theme }) => $open ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ $hasValue, theme }) => $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary};
    cursor: pointer;
    outline: none;
    transition: border-color 150ms;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const Selected = styled.span`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const Arrow = styled.span<{ $open?: boolean }>`
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%) rotate(${({ $open }) => $open ? '180deg' : '0deg'});
    transition: transform 150ms;
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: flex;
    align-items: center;
    pointer-events: none;
`;

export const Dropdown = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 1100;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    max-height: 260px;
    display: flex;
    flex-direction: column;
`;

export const Header = styled.div`
    display: flex;
    align-items: center;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const Input = styled.input`
    min-width: 0;
    flex: 1;
    width: 100%;
    padding: 8px 9px;
    font-size: 12px;
    border: none;
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
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

export const List = styled.div`
    max-height: 180px;
    overflow-y: auto;
`;

export const Option = styled.button<{ $selected?: boolean }>`
    width: 100%;
    padding: 8px 9px;
    font-size: 12px;
    text-align: left;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 100ms;
    background: ${({ $selected, theme }) => $selected ? theme.colors.accent.primary + '12' : 'transparent'};
    color: ${({ $selected, theme }) => $selected ? theme.colors.accent.primary : theme.colors.text.primary};
    font-weight: ${({ $selected }) => $selected ? 600 : 400};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const CreateAction = styled(Option)`
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.accent.primary};
    font-weight: 600;
`;

export const Empty = styled.div`
    padding: 16px 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;

export const MissingResult = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 12px;
    font-weight: 500;
    background: ${({ theme }) => theme.colors.accent.error}15;
    color: ${({ theme }) => theme.colors.accent.error};
`;

export const MissingResultContent = styled.span`
    flex: 1;
`;
