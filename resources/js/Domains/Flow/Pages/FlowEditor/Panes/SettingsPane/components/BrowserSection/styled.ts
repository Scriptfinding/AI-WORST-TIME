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

export const ViewportRow = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 6px;
`;

export const ViewportSep = styled.span`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding-bottom: 8px;
`;
