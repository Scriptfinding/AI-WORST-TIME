export interface RemoteRepo {
    id: string;
    name: string;
    full_name: string;
    default_branch: string;
    url: string;
    private: boolean;
}

export interface RepoLinkValue {
    integration_id: Id | null;
    repo_full_name: string;
    branch: string;
    file_path: string;
}
