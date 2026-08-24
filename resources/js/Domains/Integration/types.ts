import type { User } from '@/App/types';
import type { Id } from '@/Shared/types';

export type IntegrationCategory = 'ai' | 'repository' | 'vault' | 'messenger' | 'other';
export type IntegrationProvider = 'openai' | 'gemini' | 'anthropic' | 'mistral' | 'github' | 'gitlab' | 'bitbucket' | 'gitea' | 'onepassword' | 'hashicorp_vault' | 'aws_secrets_manager' | 'azure_key_vault' | 'telegram' | 'discord' | 'slack' | 'mailbox';
export type IntegrationScope = 'owner' | 'workspace' | 'team';
export interface Integration {
    id: Id;
    workspace_id: Id;
    user_id: Id | null;
    category: IntegrationCategory;
    provider: IntegrationProvider;
    name: string;
    is_active: boolean;
    is_readonly: boolean;
    scope: IntegrationScope;
    team_id: Id | null;
    provider_status: string | null;
    provider_external_url: string | null;
    webhook_url: string | null;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name'>;
    team?: { id: Id; name: string } | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
}
