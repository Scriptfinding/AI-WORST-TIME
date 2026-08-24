import type { User } from '@/App/types';
import type { Integration, IntegrationProvider } from '@/Domains/Integration/types';
import type { Id } from '@/Shared/types';

export interface UserVariable {
    id: Id;
    user_id: Id | null;
    workspace_id: Id;
    key: string;
    value: string;
    type: 'text' | 'secret' | 'object' | 'array' | 'json' | 'vault' | 'otp';
    vault_provider?: IntegrationProvider | null;
    vault_integration_id?: Id | null;
    vault_vault_id?: string | null;
    vault_vault_name?: string | null;
    vault_item_id?: string | null;
    vault_item_name?: string | null;
    vault_field_label?: string | null;
    vault_field_type?: string | null;
    scope: 'user' | 'workspace' | 'team';
    team_id: Id | null;
    group: string | null;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name'>;
    team?: { id: Id; name: string } | null;
    vault_integration?: Pick<Integration, 'id' | 'name' | 'provider'> | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
    can_manage: boolean;
    can_use: boolean;
}
