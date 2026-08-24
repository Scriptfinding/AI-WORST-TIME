import type { Id } from '@/Shared/types';

export interface PendingInvitation {
    id: number;
    team_id: Id | null;
    team: Pick<Team, 'id' | 'name'> | null;
    email: string;
    role: string;
    token: string;
    can_create_workspace: boolean;
    registration_name: string | null;
    registration_submitted_at: string | null;
    registration_email_verified_at: string | null;
    created_at: string;
}

export interface RegistrationRequest {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    origin: 'password' | 'email' | 'sso';
    created_at: string;
}

export interface TeamUser {
    id: Id;
    name: string;
    icon_type: 'emoji' | 'color' | 'upload';
    icon_value: string | null;
    icon_color: string | null;
    icon_url: string | null;
    workspace_role: string;
}

export interface Team {
    id: Id;
    name: string;
    created_at?: string;
    flows_count?: number;
    can_manage_members: boolean;
    can_update: boolean;
    can_delete: boolean;
    users: TeamUser[];
}

export type MembersTab = 'users' | 'teams';
