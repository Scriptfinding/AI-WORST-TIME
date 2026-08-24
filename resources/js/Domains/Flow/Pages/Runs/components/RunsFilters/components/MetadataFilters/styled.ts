import styled from 'styled-components';

export const MetaSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const MetaHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

export const MetaTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const DisabledNotice = styled.div`
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    line-height: 1.35;
    gap: 6px;

    > svg {
        flex-shrink: 0;
    }
`;

export const MetaPresenceGroup = styled.div`
    display: inline-flex;
    align-items: center;
    width: fit-content;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const MetaPresenceButton = styled.button<{ $active: boolean; $tone: 'none' | 'neutral' | 'any' }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    width: 34px;
    padding: 0;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme, $active, $tone }) => {
        if (!$active) return 'transparent';
        if ($tone === 'none') return theme.colors.accent.error + '14';
        if ($tone === 'any') return theme.colors.accent.success + '14';
        return theme.colors.bg.hover;
    }};
    color: ${({ theme, $active, $tone }) => {
        if (!$active) return theme.colors.text.tertiary;
        if ($tone === 'none') return theme.colors.accent.error;
        if ($tone === 'any') return theme.colors.accent.success;
        return theme.colors.text.primary;
    }};
    font-size: 12px;
    font-weight: 600;
    transition: all ${({ theme }) => theme.transition.fast};

    &:last-child {
        border-right: 0;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
`;

export const MetaRows = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;

    @media (max-width: 768px) {
        gap: 14px;
    }
`;

export const MetaRow = styled.div`
    display: grid;
    grid-template-columns: minmax(130px, 1fr) 150px minmax(130px, 1fr) 30px;
    gap: 6px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 8px;
        padding-bottom: 6px;
    }
`;

export const Input = styled.input`
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
`;

export const Select = styled.select`
    height: 34px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
`;

export const MetaRemoveButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        pointer-events: none;
    }

    @media (max-width: 768px) {
        width: 100%;
        min-height: 34px;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const MetaRemoveButtonLabel = styled.span`
    display: none;

    @media (max-width: 768px) {
        display: inline;
        font-size: 12px;
        font-weight: 600;
    }
`;

export const MetaFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
`;

export const AddMetaButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    transition: color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
`;

export const PredicateGroup = styled.div`
    display: flex;
    gap: 4px;
`;

export const PredicateButton = styled.button<{ $active: boolean }>`
    padding: 4px 9px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.border.default};
    background: ${({ theme, $active }) => $active ? theme.colors.accent.primary + '18' : 'transparent'};
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 700;

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
`;
