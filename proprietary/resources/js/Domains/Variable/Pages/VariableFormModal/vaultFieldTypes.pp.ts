export interface VaultItem {
    id: string;
    title: string;
    category: string;
}

export interface VaultField {
    id: string;
    label: string;
    type: string;
}

export interface VaultEntry {
    id: string;
    name: string;
}

export interface VaultData {
    provider: string;
    integrationId: Id;
    vaultId: string;
    vaultName: string;
    itemId: string;
    itemName: string;
    fieldLabel: string;
    fieldType: string;
}

export interface VaultEditing {
    vault_integration_id?: Id | null;
    vault_integration?: { id: Id } | null;
    vault_vault_id?: string | null;
    vault_item_id?: string | null;
}

export interface VaultProviderLabels {
    vault: string;
    item: string;
    field: string;
}

export type VaultDataPatch = Partial<VaultData>;
