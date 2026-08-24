import type { InertiaFormProps } from '@inertiajs/react';

export interface SettingsFormData {
    name: string;
    description: string;
    available_in_mcp: boolean;
    queue_index: number | null;
    proxy_mode: 'none' | 'auto' | 'specific';
    workspace_proxy_id: number | null;
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
    runs_retention_limit: number;
    viewport_width: number | '';
    viewport_height: number | '';
    keyboard_speed: number | '';
    disable_web_security: boolean;
}

export type SettingsForm = InertiaFormProps<SettingsFormData>;
