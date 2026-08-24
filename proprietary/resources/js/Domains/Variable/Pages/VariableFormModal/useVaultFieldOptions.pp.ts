import { useRef, useState } from 'react';
import { useVaultEditingHydration } from './useVaultEditHydration.pp';
import { useVaultOptionsStage } from './useVaultOptionsStage.pp';
import {
    getVaultFieldsUrl,
    getVaultItemsUrl,
    getVaultsUrl,
    parseOptions,
} from './utils.pp';
import type {
    VaultEditing,
    VaultEntry,
    VaultField,
    VaultItem,
} from './vaultFieldTypes.pp';

interface VaultFieldOptionsInput {
    integrationId: Id | null;
    vaultId: string;
    itemId: string;
    editing?: VaultEditing | null;
    isOpen: boolean;
}

// Loads dependent vault, item, and field choices for the variable form.
export function useVaultFieldOptions({
    integrationId,
    vaultId,
    itemId,
    editing,
    isOpen,
}: VaultFieldOptionsInput) {
    const [vaults, setVaults] = useState<VaultEntry[]>([]);
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [vaultFields, setVaultFields] = useState<VaultField[]>([]);
    const [vaultsLoading, setVaultsLoading] = useState(false);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const vaultsGeneration = useRef(0);
    const itemsGeneration = useRef(0);
    const fieldsGeneration = useRef(0);

    useVaultOptionsStage<VaultEntry>({
        enabled: Boolean(integrationId),
        key: JSON.stringify([integrationId]),
        url: getVaultsUrl(integrationId ?? ''),
        parse: parseOptions<VaultEntry>,
        onLoading: loading => {
            setVaultsLoading(loading);
            setItemsLoading(false);
            setFieldsLoading(false);
        },
        onSuccess: setVaults,
        onReset: () => {
            setVaults([]);
            setVaultItems([]);
            setVaultFields([]);
        },
        generationScope: [
            vaultsGeneration,
            itemsGeneration,
            fieldsGeneration,
        ],
    });

    useVaultOptionsStage<VaultItem>({
        enabled: Boolean(integrationId && vaultId),
        key: JSON.stringify([integrationId, vaultId]),
        url: getVaultItemsUrl(integrationId ?? '', vaultId),
        parse: parseOptions<VaultItem>,
        onLoading: loading => {
            setItemsLoading(loading);
            setFieldsLoading(false);
        },
        onSuccess: setVaultItems,
        onReset: () => {
            setVaultItems([]);
            setVaultFields([]);
        },
        generationScope: [itemsGeneration, fieldsGeneration],
    });

    useVaultOptionsStage<VaultField>({
        enabled: Boolean(integrationId && vaultId && itemId),
        key: JSON.stringify([integrationId, vaultId, itemId]),
        url: getVaultFieldsUrl(integrationId ?? '', vaultId, itemId),
        parse: parseOptions<VaultField>,
        onLoading: setFieldsLoading,
        onSuccess: setVaultFields,
        onReset: () => setVaultFields([]),
        generationScope: [fieldsGeneration],
    });

    useVaultEditingHydration({
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
    });

    return {
        vaults,
        vaultItems,
        vaultFields,
        vaultsLoading,
        itemsLoading,
        fieldsLoading,
    };
}
