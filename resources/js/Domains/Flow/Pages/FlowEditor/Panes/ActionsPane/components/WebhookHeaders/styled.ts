import styled from 'styled-components';
import {
    MetadataFilterAddRow,
    MetadataFilterInput,
    MetadataFilterRemove,
    MetadataFilterRow,
    SettingsSectionLabel,
} from '@/Domains/Flow/Pages/FlowEditor/shared/forms.styled';

export const Label = styled(SettingsSectionLabel)`
    margin-bottom: 6px;
`;

export const HeaderRow = styled(MetadataFilterRow)`
    margin-bottom: 4px;
`;

export const HeaderInput = styled(MetadataFilterInput)`
    background: ${({ theme }) => theme.colors.bg.primary};
`;
export const RemoveButton = styled(MetadataFilterRemove)``;
export const AddButton = styled(MetadataFilterAddRow)``;
