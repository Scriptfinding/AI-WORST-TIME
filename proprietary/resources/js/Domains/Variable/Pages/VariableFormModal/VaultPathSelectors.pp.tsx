import SearchSelect from '@proprietary/Domains/Variable/Pages/VariableFormModal/SearchSelect.pp';
import type {
    VaultData,
    VaultDataPatch,
    VaultEntry,
    VaultItem,
    VaultProviderLabels,
} from './vaultFieldTypes.pp';
import * as S from './VaultPathSelectors.styled.pp';

interface VaultPathSelectorsProps {
    data: VaultData;
    labels: VaultProviderLabels;
    vaults: VaultEntry[];
    items: VaultItem[];
    vaultsLoading: boolean;
    itemsLoading: boolean;
    onChange: (patch: VaultDataPatch) => void;
}

export default function VaultPathSelectors({
    data,
    labels,
    vaults,
    items,
    vaultsLoading,
    itemsLoading,
    onChange,
}: VaultPathSelectorsProps) {
    return (
        <S.Section>
            <SearchSelect
                label={labels.vault}
                value={data.vaultId}
                onChange={value => {
                    const vault = vaults.find(candidate => candidate.id === value);
                    onChange({
                        vaultId: value,
                        vaultName: vault?.name || '',
                        itemId: '',
                        itemName: '',
                        fieldLabel: '',
                        fieldType: '',
                    });
                }}
                options={vaults.map(vault => ({ value: vault.id, label: vault.name }))}
                loading={vaultsLoading}
                loadingLabel={`Loading ${labels.vault.toLowerCase()}s...`}
                placeholder={`Select a ${labels.vault.toLowerCase()}`}
            />
            {data.vaultId && (
                <SearchSelect
                    label={labels.item}
                    value={data.itemId}
                    onChange={value => {
                        const item = items.find(candidate => candidate.id === value);
                        onChange({
                            itemId: value,
                            itemName: item?.title || '',
                            fieldLabel: '',
                            fieldType: '',
                        });
                    }}
                    options={items.map(item => ({
                        value: item.id,
                        label: `${item.title} (${item.category})`,
                    }))}
                    loading={itemsLoading}
                    loadingLabel={`Loading ${labels.item.toLowerCase()}s...`}
                    placeholder={`Select a ${labels.item.toLowerCase()}`}
                />
            )}
        </S.Section>
    );
}
