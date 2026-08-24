import styled, { keyframes } from 'styled-components';
import { checkboxStyles } from '@/Shared/UI/Checkbox/styles';

const FILTER_BAR_HEIGHT = '42px';

export const BackBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: none;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const SearchBox = styled.div`
    padding: 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    height: ${FILTER_BAR_HEIGHT};
    min-height: ${FILTER_BAR_HEIGHT};
    box-sizing: border-box;
`;

export const SearchInput = styled.input`
    flex: 1;
    min-width: 0;
    padding: 5px 8px;
    font-size: 11px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    transition: border-color ${({ theme }) => theme.transition.fast};
    &:focus { border-color: ${({ theme }) => theme.colors.border.focus}; }
    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
`;

export const SelectAllCheckbox = styled.input`
    ${checkboxStyles}
`;

export const SortBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 4px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

export const Spinner = styled.div`
    width: 16px;
    height: 16px;
    border: 2px solid ${({ theme }) => theme.colors.border.default};
    border-top-color: ${({ theme }) => theme.colors.accent.primary};
    border-radius: 50%;
    animation: ${spin} 0.6s linear infinite;
    margin: 0 auto;
`;

export const EmailCheckbox = styled.input`
    ${checkboxStyles}
    display: none;
`;

export const EmailIconDefault = styled.div`
    display: flex;
`;

export const EmailIconWrap = styled.div`
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const EmailItem = styled.div<{ $active?: boolean; $unread?: boolean; $selected?: boolean }>`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    border-left: 3px solid ${({ $active, theme }) => $active ? theme.colors.accent.primary : 'transparent'};
    transition: background ${({ theme }) => theme.transition.fast};

    background: ${({ $active, $unread, $selected, theme }) => {
        if ($selected) return theme.colors.accent.primary + (theme.mode === 'dark' ? '28' : '12');
        if ($active) return theme.colors.bg.hover;
        if ($unread) return theme.mode === 'dark' ? '#1a1a2e' : '#f0f4ff';
        return 'transparent';
    }};

    &:hover { background: ${({ theme }) => theme.colors.bg.secondary}; }

    &:hover ${EmailIconDefault} { display: none; }
    &:hover ${EmailCheckbox} { display: inline-grid; }

    ${({ $selected }) => $selected && `
        ${EmailIconDefault} { display: none; }
        ${EmailCheckbox} { display: inline-grid; }
    `}
`;

export const EmailContent = styled.div`
    flex: 1;
    min-width: 0;
`;

export const EmailFrom = styled.div<{ $unread?: boolean }>`
    font-size: 12px;
    font-weight: ${({ $unread }) => $unread ? 600 : 400};
    color: ${({ theme, $unread }) => $unread ? theme.colors.text.primary : theme.colors.text.secondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const EmailRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
`;

export const EmailSubject = styled.div<{ $unread?: boolean }>`
    font-size: 11px;
    font-weight: ${({ $unread }) => $unread ? 500 : 400};
    color: ${({ theme, $unread }) => $unread ? theme.colors.text.primary : theme.colors.text.secondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
`;

export const EmailDate = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    white-space: nowrap;
    flex-shrink: 0;
`;

export const LoadMore = styled.div`
    padding: 8px;
    text-align: center;
`;

export const LoadMoreBtn = styled.button`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.primary};
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 12px;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: background ${({ theme }) => theme.transition.fast};
    &:hover { background: ${({ theme }) => theme.colors.bg.secondary}; }
`;
