import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
    createLoadScope,
    getVaultFieldsUrl,
    getVaultItemsUrl,
    getVaultsUrl,
    loadOptions,
    parseOptions,
} from './utils.pp';
import type { GenerationRef } from './utils.pp';
import type {
    VaultEditing,
    VaultEntry,
    VaultField,
    VaultItem,
} from './vaultFieldTypes.pp';

interface VaultEditingHydrationInput {
    editing?: VaultEditing | null;
    isOpen: boolean;
    vaultsGeneration: GenerationRef;
    itemsGeneration: GenerationRef;
    fieldsGeneration: GenerationRef;
    setVaults: Dispatch<SetStateAction<VaultEntry[]>>;
    setVaultItems: Dispatch<SetStateAction<VaultItem[]>>;
    setVaultFields: Dispatch<SetStateAction<VaultField[]>>;
    setVaultsLoading: Dispatch<SetStateAction<boolean>>;
    setItemsLoading: Dispatch<SetStateAction<boolean>>;
    setFieldsLoading: Dispatch<SetStateAction<boolean>>;
}

// Preloads the full vault option chain needed to edit an existing variable.
export function useVaultEditingHydration({
    editing,
    isOpen,
    vaultsGeneration,
    itemsGeneration,
    fieldsGeneration,
    setVaults,
    setVaultItems,
    setVaultFields,
    setVaultsLoading,
    setItemsLoading,
    setFieldsLoading,
}: VaultEditingHydrationInput) {
    useEffect(() => {
        if (!editing?.vault_integration?.id) return;

        const scope = createLoadScope([
            vaultsGeneration,
            itemsGeneration,
            fieldsGeneration,
        ]);
        const editingIntegrationId = editing.vault_integration.id;
        const editingVaultId = editing.vault_vault_id;
        const editingItemId = editing.vault_item_id;

        setVaultsLoading(true);

        const hydrateOptions = async () => {
            const vaultsLoaded = await loadOptions<VaultEntry>({
                url: getVaultsUrl(editingIntegrationId),
                signal: scope.signal,
                isCurrent: () => scope.isCurrent(vaultsGeneration),
                parse: parseOptions<VaultEntry>,
                setOptions: setVaults,
                setLoading: setVaultsLoading,
            });

            if (!vaultsLoaded || !editingVaultId) return;

            setItemsLoading(true);
            const itemsLoaded = await loadOptions<VaultItem>({
                url: getVaultItemsUrl(editingIntegrationId, editingVaultId),
                signal: scope.signal,
                isCurrent: () => scope.isCurrent(itemsGeneration),
                parse: parseOptions<VaultItem>,
                setOptions: setVaultItems,
                setLoading: setItemsLoading,
            });

            if (!itemsLoaded || !editingItemId) return;

            setFieldsLoading(true);
            await loadOptions<VaultField>({
                url: getVaultFieldsUrl(
                    editingIntegrationId,
                    editingVaultId,
                    editingItemId,
                ),
                signal: scope.signal,
                isCurrent: () => scope.isCurrent(fieldsGeneration),
                parse: parseOptions<VaultField>,
                setOptions: setVaultFields,
                setLoading: setFieldsLoading,
            });
        };

        void hydrateOptions();

        return scope.abort;
    }, [
        editing,
        fieldsGeneration,
        isOpen,
        itemsGeneration,
        setFieldsLoading,
        setItemsLoading,
        setVaultFields,
        setVaultItems,
        setVaults,
        setVaultsLoading,
        vaultsGeneration,
    ]);
}
