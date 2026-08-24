import type { User } from '@/App/types';
import type { Integration } from '@/Domains/Integration/types';
import type { Id } from '@/Shared/types';

export interface AiModelCapabilities {
    text?: boolean;
    vision?: boolean;
    structured_output?: boolean;
    tools?: boolean;
}

export interface AiModel {
    id: Id;
    workspace_id: Id;
    user_id: Id | null;
    team_id: Id | null;
    ai_integration_id: Id;
    name: string;
    ai_model_id: string;
    capabilities: AiModelCapabilities;
    scope: 'user' | 'workspace' | 'team';
    group: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name'>;
    team?: { id: Id; name: string } | null;
    ai_integration?: Pick<Integration, 'id' | 'name' | 'provider'> | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
}

export interface CreatedAiModel {
    id: Id;
    name: string;
    ai_integration_id: Id;
    ai_model_id: string;
    capabilities: AiModelCapabilities;
}

export interface AiIntegration {
    id: Id;
    name: string;
    provider: Integration['provider'];
}

export interface DiscoveredAiModel {
    id: string;
    label?: string;
    capabilities?: AiModelCapabilities;
}

export interface AiModelUsage {
    flow_id: Id;
    flow_name: string;
    icon_type?: string;
    icon_value?: string | null;
    icon_color?: string | null;
    icon_url?: string | null;
}

export interface AiModelFilters {
    search: string;
    group: string | null;
    scope: string | null;
}
