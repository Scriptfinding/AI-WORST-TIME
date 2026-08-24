import type React from 'react';

export type VariableType = 'text' | 'secret' | 'object' | 'array' | 'json' | 'vault' | 'otp';

export type VariableFormData = {
    key: string;
    value: string;
    type: VariableType;
    scope: string;
    group: string;
    vault_provider: string;
    vault_integration_id: Id;
    vault_vault_id: string;
    vault_vault_name: string;
    vault_item_id: string;
    vault_item_name: string;
    vault_field_label: string;
    vault_field_type: string;
};

export type VaultFormPatch = Partial<{
    integrationId: Id;
    vaultId: string;
    vaultName: string;
    itemId: string;
    itemName: string;
    fieldLabel: string;
    fieldType: string;
}>;

export type ConfirmVariableAction = (options: {
    title?: string;
    message: React.ReactNode;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
}) => Promise<boolean>;
