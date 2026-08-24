export interface ActionFormData {
    label: string;
    url: string;
    secret: string;
    fire_on_error: boolean;
    export_artifacts_screenshots: boolean | null;
    export_artifacts_downloads: boolean | null;
    export_artifacts_recording: boolean | null;
}

export interface TeamOption {
    id: Id;
    name: string;
}
