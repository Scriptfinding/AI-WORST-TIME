import type { User } from '@/App/types';
import type { Integration } from '@/Domains/Integration/types';
import type { Id } from '@/Shared/types';

export interface NotificationChannel {
    id: Id;
    workspace_id: Id;
    user_id: Id | null;
    messenger_integration_id: Id | null;
    name: string;
    provider: 'telegram' | 'discord' | 'slack';
    config: {
        token?: string;
        chat_id?: string;
        chat_name?: string;
        app_token?: string;
    } | null;
    is_active: boolean;
    scope: 'user' | 'workspace' | 'team';
    team_id: Id | null;
    group: string | null;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name'>;
    team?: { id: Id; name: string } | null;
    messenger_integration?: Pick<Integration, 'id' | 'name' | 'provider'> | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
}

export interface CreatedNotificationChannel {
    id: Id;
    name: string;
    messenger_integration_id: Id;
    config: {
        chat_id: string | null;
        chat_name: string | null;
    };
}
