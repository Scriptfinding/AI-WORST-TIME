import { useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import type { Integration } from '@/Domains/Integration/types';
import { useVaultFieldOptions } from './useVaultFieldOptions.pp';
import VaultIntegrationSelect from './VaultIntegrationSelect.pp';
import VaultPathSelectors from './VaultPathSelectors.pp';
import type {
    VaultData,
    VaultDataPatch,
    VaultEditing,
    VaultProviderLabels,
} from './vaultFieldTypes.pp';
import VaultValueOptionsSection from './VaultValueOptionsSection.pp';

interface VaultFieldsProps {
    data: VaultData;
    onChange: (patch: VaultDataPatch) => void;
    editing?: VaultEditing | null;
    isOpen: boolean;
}

const PROVIDER_LABELS: Record<string, VaultProviderLabels> = {
    onepassword: { vault: 'Vault', item: 'Item', field: 'Field' },
    hashicorp_vault: { vault: 'Mount', item: 'Secret path', field: 'Key' },
    aws_secrets_manager: { vault: 'Region', item: 'Secret', field: 'Key' },
    azure_key_vault: { vault: 'Key Vault', item: 'Secret', field: 'Version' },
};

export default function VaultFields({ data, onChange, editing, isOpen }: VaultFieldsProps) {
    const { vaultIntegrations = [] } = usePage<{ vaultIntegrations: Integration[] }>().props;
    const labels = PROVIDER_LABELS[data.provider] || PROVIDER_LABELS.onepassword;
    const integrationId = data.integrationId || null;
    const {
        vaults,
        vaultItems,
        vaultFields,
        vaultsLoading,
        itemsLoading,
        fieldsLoading,
    } = useVaultFieldOptions({
        integrationId,
        vaultId: data.vaultId,
        itemId: data.itemId,
        editing,
        isOpen,
    });

    const connectionsForProvider = useMemo(
        () => data.provider
            ? vaultIntegrations.filter(vi => vi.provider === data.provider)
            : [],
        [data.provider, vaultIntegrations],
    );

    useEffect(() => {
        if (connectionsForProvider.length === 1 && !data.integrationId) {
            onChange({ integrationId: connectionsForProvider[0].id, vaultId: '', vaultName: '', itemId: '', itemName: '', fieldLabel: '', fieldType: '' });
        }
    }, [connectionsForProvider, data.integrationId, onChange]);

    return (
        <>
            <VaultIntegrationSelect
                connections={connectionsForProvider}
                integrationId={data.integrationId}
                onChange={onChange}
            />
            {data.integrationId && (
                <>
                    <VaultPathSelectors
                        data={data}
                        labels={labels}
                        vaults={vaults}
                        items={vaultItems}
                        vaultsLoading={vaultsLoading}
                        itemsLoading={itemsLoading}
                        onChange={onChange}
                    />
                    {data.itemId && (
                        <VaultValueOptionsSection
                            fieldLabel={data.fieldLabel}
                            fields={vaultFields}
                            fieldsLoading={fieldsLoading}
                            labels={labels}
                            onChange={onChange}
                        />
                    )}
                </>
            )}
        </>
    );
}
