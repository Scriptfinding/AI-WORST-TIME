import type { User } from '@/App/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { Id } from '@/Shared/types';

export interface Workspace {
    id: Id;
    name: string;
    slug: string;
    lookup_key: string | null;
    owner_id: Id | null;
    expires_at: string | null;
    owner?: Pick<User, 'id' | 'name' | 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url'> | null;
    runs_retention_default: number;
    runs_retention_max: number;
    default_flow_timeout_seconds: number;
    max_flow_timeout_seconds: number;
    max_retries_default: number;
    max_retries_max: number;
    viewport_width: number;
    viewport_height: number;
    keyboard_speed: number;
    debug_log_object_depth: number;
    debug_log_array_limit: number;
    allow_trigger_advertising: boolean;
    require_two_factor: boolean;
    default_flow_type: 'code' | 'nodal';
    default_flow_code: string | null;
    default_flow_nodal_graph: NodalGraph | null;
    icon_type: 'emoji' | 'color' | 'upload';
    icon_value: string | null;
    icon_color: string | null;
    icon_upload_path: string | null;
    icon_url: string | null;
    users?: WorkspaceUser[];
    users_count?: number;
    flows_count?: number;
}
export interface WorkspaceUser extends User {
    pivot: {
        role: 'admin' | 'manager' | 'member';
        created_at?: string;
    };
    flows_count?: number;
}
export interface WorkspaceProxy {
    id: number;
    label: string;
    scheme: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: number;
    has_authentication: boolean;
    visibility: 'owner' | 'workspace' | 'team';
    user_id: Id | null;
    team_id: Id | null;
    group: string | null;
    owner: { id: string; name: string } | null;
    team: { id: string; name: string } | null;
    created_at: string | null;
    updated_at: string | null;
}
export interface WorkspaceMcpSettings {
    enabled: boolean;
    include_unexposed_flow_previews: boolean;
    enabled_tools: string[];
}
export interface McpTool {
    name: string;
    description: string;
    enabled_by_default: boolean;
}
export interface McpAccessToken {
    id: number;
    name: string;
    token_preview: string;
    last_used_at: string | null;
    created_at: string;
    user: Pick<User, 'id' | 'name'> | null;
}
export interface McpOauthClient {
    id: number;
    oauth_client_id: string;
    name: string;
    redirect_uri: string;
    created_at: string;
    user: Pick<User, 'id' | 'name'> | null;
}
export interface McpOauthConnection {
    id: number;
    oauth_client_id: string;
    client_name: string;
    last_used_at: string | null;
    created_at: string;
    user: Pick<User, 'id' | 'name'> | null;
}
export interface McpFlow {
    id: Id;
    name: string;
    description: string | null;
    visibility: 'owner' | 'workspace' | 'team';
    team: { id: Id; name: string } | null;
    owner: Pick<User, 'id' | 'name'> | null;
    is_published: boolean;
    available_in_mcp: boolean;
    updated_at: string;
}
