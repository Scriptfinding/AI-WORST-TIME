import type { Integration } from '@/Domains/Integration/types';
import type { UserVariable } from '@/Domains/Variable/types';
import VaultFields from '@proprietary/Domains/Variable/Pages/VariableFormModal/VaultFields.pp';
import type { VariableFormData, VaultFormPatch } from '@/Domains/Variable/Pages/VariableFormModal/types';
import { buildVaultTypeOptions } from '@proprietary/Domains/Variable/Pages/VariableFormModal/utils.pp';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import * as InputShared from '@/Shared/UI/Input/shared.styled';
import { DATA_TYPE_ICONS } from '@/Shared/Utils/dataTypeIcons';

interface TypeProviderSelectionProps {
    data: VariableFormData;
    error?: string;
    editing: UserVariable | null;
    integrations: Integration[];
    isOpen: boolean;
    onTypeChange: (value: string) => void;
    onVaultChange: (patch: VaultFormPatch) => void;
}

export default function TypeProviderSelection({
    data,
    error,
    editing,
    integrations,
    isOpen,
    onTypeChange,
    onVaultChange,
}: TypeProviderSelectionProps) {
    const selectedType = data.type === 'vault' && data.vault_provider
        ? `vault:${data.vault_provider}`
        : data.type;
    const options = [
        { value: 'text', label: 'Text', icon: DATA_TYPE_ICONS.text },
        { value: 'secret', label: 'Secret', icon: DATA_TYPE_ICONS.secret },
        { value: 'object', label: 'Object', icon: DATA_TYPE_ICONS.object },
        { value: 'array', label: 'Array', icon: DATA_TYPE_ICONS.array },
        { value: 'otp', label: 'One Time Password', icon: DATA_TYPE_ICONS.otp },
        ...buildVaultTypeOptions(integrations).map(option => {
            const isOnePassword = option.value === 'vault:onepassword';
            return {
                ...option,
                icon: isOnePassword ? 'simple-icons:1password' : DATA_TYPE_ICONS.vault,
                ...(isOnePassword ? { iconColor: '#0572ec' } : {}),
            };
        }),
    ];

    return (
        <>
            <InputShared.Wrapper $fullWidth>
                <InputShared.Label>Type</InputShared.Label>
                <CustomSelect
                    value={selectedType}
                    options={options}
                    invalid={Boolean(error)}
                    searchThreshold={0}
                    showOptionValue={false}
                    onChange={onTypeChange}
                />
                {error && <InputShared.Error>{error}</InputShared.Error>}
            </InputShared.Wrapper>
            {data.type === 'vault' && (
                <VaultFields
                    data={{
                        provider: data.vault_provider,
                        integrationId: data.vault_integration_id,
                        vaultId: data.vault_vault_id,
                        vaultName: data.vault_vault_name,
                        itemId: data.vault_item_id,
                        itemName: data.vault_item_name,
                        fieldLabel: data.vault_field_label,
                        fieldType: data.vault_field_type,
                    }}
                    onChange={onVaultChange}
                    editing={editing?.type === 'vault' ? editing : null}
                    isOpen={isOpen}
                />
            )}
        </>
    );
}
