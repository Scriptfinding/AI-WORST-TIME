import type { User } from '@/App/types';
import type { Folder } from '@/Domains/Folder/types';
import type { Integration, IntegrationScope } from '@/Domains/Integration/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { FlowInputDefinition } from '@/Domains/Flow/Utils/flowInputsMetadata';
import type { Id } from '@/Shared/types';

export interface Flow {
    id: Id;
    name: string;
    icon_type: 'emoji' | 'color' | 'upload';
    icon_value: string | null;
    icon_color: string | null;
    cover_color: string | null;
    icon_upload_path: string | null;
    icon_url: string | null;
    description: string | null;
    readme: string | null;
    code: string | null;
    manual_input: Record<string, unknown> | null;
    default_inputs: Record<string, unknown> | null;
    blueprint_input_definitions?: FlowInputDefinition[] | null;
    workspace_id: Id;
    folder_id: Id | null;
    workspace_folder_id: Id | null;
    team_id: Id | null;
    owner_id: Id | null;
    is_published: boolean;
    published_version_id: number | null;
    published_version_number?: number | null;
    available_in_mcp: boolean;
    queue_index: number | null;
    proxy_mode: 'none' | 'auto' | 'specific';
    workspace_proxy_id: number | null;
    visibility: 'owner' | 'workspace' | 'team';
    timeout_seconds: number;
    operator_seconds: number;
    max_retries: number;
    include_raw_output: boolean;
    include_input_in_output: boolean;
    include_context_in_output: boolean;
    always_success_response: boolean;
    export_artifacts_screenshots: boolean;
    export_artifacts_downloads: boolean;
    export_artifacts_recording: boolean;
    runs_retention_limit: number | null;
    viewport_width: number | null;
    viewport_height: number | null;
    keyboard_speed: number | null;
    disable_web_security: boolean | null;
    source_type: 'code' | 'repository' | 'library';
    flow_type: 'code' | 'nodal';
    nodal_graph: NodalGraph | null;
    library_external_id: number | null;
    library_external_key: string | null;
    library_namespace: string | null;
    library_reference: string | null;
    library_source_path: string | null;
    library_source_sha: string | null;
    library_source_url: string | null;
    library_imported_at: string | null;
    library_locked: boolean;
    library_latest_source_sha?: string | null;
    library_update_available?: boolean;
    last_run_result: Record<string, unknown> | null;
    last_run_at: string | null;
    created_at: string;
    updated_at: string;
    content_updated_at: string | null;
    triggers_count?: number;
    actions_count?: number;
    owner?: Pick<User, 'id' | 'name'>;
    folder?: Pick<Folder, 'id' | 'name'>;
    workspace_folder?: Pick<Folder, 'id' | 'name'>;
    latest_run?: FlowRun | null;
    repository_link?: FlowRepositoryLink | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
}
export type WebhookHeader = {
    key: string;
    value: string;
};
export interface FlowTrigger {
    id: Id;
    flow_id: Id;
    user_id: Id | null;
    type: 'webhook' | 'cron';
    label: string;
    group: string | null;
    input_template: Record<string, unknown> | null;
    config: Record<string, unknown> | null;
    is_active: boolean;
    is_public: boolean;
    scope: IntegrationScope;
    team_id: Id | null;
    last_triggered_at: string | null;
    endpoint_url?: string;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name'>;
    team?: { id: Id; name: string } | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
}
export interface FlowAction {
    id: Id;
    flow_id: Id;
    user_id: Id | null;
    type: 'webhook';
    label: string;
    group: string | null;
    config: {
        url?: string;
        secret?: string;
        headers?: WebhookHeader[];
    } | null;
    is_active: boolean;
    is_public: boolean;
    scope: IntegrationScope;
    team_id: Id | null;
    fire_on_error: boolean;
    export_artifacts_screenshots: boolean | null;
    export_artifacts_downloads: boolean | null;
    export_artifacts_recording: boolean | null;
    last_triggered_at: string | null;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name'>;
    team?: { id: Id; name: string } | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
}
export interface ActionResult {
    action_id: Id;
    type: string;
    label: string;
    success: boolean;
    url?: string;
    status?: number;
    error?: string;
    sent_at?: string;
}
export interface ConsoleLogEntry {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    ts: string;
}
export interface ActionLogEntry {
    action: string;
    label: string;
    offset_ms: number;
    node_id?: string;
    sequence_id?: string;
    parent_action?: 'aiControl';
    sequence_role?: 'parent' | 'generated';
    iteration?: number;
    facade?: 'puppetflow' | 'browser' | 'policy';
    status?: 'success' | 'error';
    args?: unknown;
    result?: unknown;
    error?: string;
    action_key?: string;
    invocation_index?: number;
}
export interface FlowRun {
    id: number;
    flow_id: Id;
    triggered_by?: string | null;
    trigger_id: Id | null;
    trigger_type: 'manual' | 'webhook' | 'cron' | 'schedule' | 'api';
    status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
    input: Record<string, unknown> | null;
    output: Record<string, unknown> | null;
    error_message: string | null;
    console_logs: ConsoleLogEntry[] | null;
    action_logs: ActionLogEntry[] | null;
    code_snapshot: string | null;
    duration_ms: number | null;
    screenshots_count: number;
    downloads_count: number;
    has_recording: boolean;
    secrets_redacted?: boolean;
    legend: string | null;
    meta: Record<string, unknown> | null;
    internal_meta?: {
        nodal_preview?: {
            input?: unknown;
            output?: unknown;
        };
    } | null;
    webhook_info: Record<string, unknown> | null;
    action_results: ActionResult[] | null;
    running_at: string | null;
    created_at: string;
    triggered_by_user?: Pick<User, 'id' | 'name'>;
    trigger?: FlowTrigger | null;
    flow?: Pick<Flow, 'id' | 'name' | 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url' | 'timeout_seconds' | 'flow_type' | 'nodal_graph' | 'keyboard_speed' | 'viewport_width' | 'viewport_height'>;
}
export interface ArtifactFile {
    name: string;
    size: number;
    modified_at: string;
}
export interface FlowRepositoryLink {
    id: number;
    flow_id: Id;
    integration_id: Id;
    repo_full_name: string;
    branch: string;
    file_path: string;
    sync_trigger: 'push' | 'tag';
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
    integration?: Integration;
}
