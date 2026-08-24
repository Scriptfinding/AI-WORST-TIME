import SearchSelect from '@proprietary/Domains/Variable/Pages/VariableFormModal/SearchSelect.pp';
import type {
    VaultDataPatch,
    VaultField,
    VaultProviderLabels,
} from './vaultFieldTypes.pp';
import * as S from './VaultValueOptionsSection.styled.pp';

interface VaultValueOptionsSectionProps {
    fieldLabel: string;
    fields: VaultField[];
    fieldsLoading: boolean;
    labels: VaultProviderLabels;
    onChange: (patch: VaultDataPatch) => void;
}

export default function VaultValueOptionsSection({
    fieldLabel,
    fields,
    fieldsLoading,
    labels,
    onChange,
}: VaultValueOptionsSectionProps) {
    return (
        <S.Section>
            <SearchSelect
                label={labels.field}
                value={fieldLabel}
                onChange={value => {
                    const field = fields.find(candidate => candidate.label === value);
                    onChange({ fieldLabel: value, fieldType: field?.type || '' });
                }}
                options={fields.map(field => ({
                    value: field.label,
                    label: `${field.label} (${field.type})`,
                }))}
                loading={fieldsLoading}
                loadingLabel={`Loading ${labels.field.toLowerCase()}s...`}
                placeholder={`Select a ${labels.field.toLowerCase()}`}
            />
        </S.Section>
    );
}
