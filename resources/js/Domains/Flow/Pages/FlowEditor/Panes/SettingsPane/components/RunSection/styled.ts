import styled from 'styled-components';
import { settingsHintStyles, settingsSectionLabelStyles, settingsSeparatorStyles } from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/shared.styled';

export const SettingsHint = styled.div`
    ${settingsHintStyles}
`;

export const SettingsSectionLabel = styled.div`
    ${settingsSectionLabelStyles}
`;

export const SettingsSeparator = styled.hr`
    ${settingsSeparatorStyles}
`;

export const ProxyField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const ProxyLabel = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ProxyError = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.accent.error};
`;
