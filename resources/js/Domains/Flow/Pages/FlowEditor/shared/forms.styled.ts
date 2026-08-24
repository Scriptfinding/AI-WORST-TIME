import styled from 'styled-components';

export const SettingsForm = styled.form`
    display: flex;
    padding-top: 16px;
    flex-direction: column;
    gap: 12px;
`;

export const SettingsSeparator = styled.hr`
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    margin: 4px 0;
`;

export const SettingsSectionLabel = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const SettingsHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
    margin-top: -8px;
`;

export const MetadataFilterRow = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const MetadataFilterInput = styled.input`
    flex: 1;
    min-width: 0;
    padding: 5px 8px;
    font-size: 11px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};
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

export const MetadataFilterSelect = styled.select`
    flex-shrink: 0;
    padding: 5px 4px;
    font-size: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
`;

export const MetadataFilterRemove = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border: none;
    background: none;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        pointer-events: none;
    }
`;

export const MetadataFilterAddRow = styled.button`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: none;
    border: none;
    cursor: pointer;
    transition: color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
`;
