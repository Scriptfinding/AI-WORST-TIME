import type { Workspace } from '@/Domains/Workspace/types';
import type { Id } from '@/Shared/types';

export interface User {
    id: Id;
    name: string;
    email: string;
    role: 'admin' | 'member';
    workspace_role: 'admin' | 'manager' | 'member';
    can_create_workspace: boolean;
    timezone: string;
    explorer_view_mode: 'grid' | 'list';
    onboarding_versions: Record<string, number>;
    avatar_url: string | null;
    icon_type: 'emoji' | 'color' | 'upload';
    icon_value: string | null;
    icon_color: string | null;
    icon_url: string | null;
    current_workspace_id: Id | null;
    two_factor_enabled: boolean;
}
export interface AppSettings {
    invitation_requests_enabled: boolean;
    magic_link_enabled: boolean;
    server_timezone?: string;
    max_flow_timeout_seconds: number;
    grabber_store_url: string;
    queues_counter: number;
    snippets_enabled: boolean;
    variables_enabled: boolean;
    run_metadata_search_enabled: boolean;
    mcp_enabled: boolean;
    private_libraries_enabled: boolean;
    vaults_enabled: boolean;
    messenger_enabled: boolean;
    mailbox_enabled: boolean;
    ai_enabled: boolean;
    vcs_enabled: boolean;
    recording_enabled: boolean;
    live_view_enabled: boolean;
    teams_enabled: boolean;
    workspace_sharing_enabled: boolean;
    two_factor_enforcement_enabled: boolean;
    whitelabel_enabled: boolean;
    sso_enabled: boolean;
    github_stargazers: boolean;
    workspace_limit: number;
    concurrent_runs_limit: number;
    maximum_retention_limit: number;
    maximum_timeout_seconds: number;
    maximum_retries_limit: number;
    promote_disabled_features: boolean;
    disabled_feature_message: string;
}
export interface Branding {
    name: string;
    logo_url: string;
    accent_color: string;
    customized: boolean;
}
export interface PageProps extends Record<string, unknown> {
    auth: {
        user: User | null;
    };
    safe_mode: boolean;
    impersonating: boolean;
    workspace_quota: {
        exceeded: boolean;
        used: number;
        limit: number;
    } | null;
    run_quota: {
        exceeded: boolean;
        used: number;
        limit: number;
        resets_at: string;
    } | null;
    currentWorkspace: Workspace | null;
    workspaces: Pick<Workspace, 'id' | 'name' | 'slug' | 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url'>[];
    settings: AppSettings;
    branding: Branding;
    flash: {
        id: string | null;
        success: string | null;
        error: string | null;
        external_app_integration_id: Id | null;
    };
}
