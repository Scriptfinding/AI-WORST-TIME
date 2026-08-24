export interface PrivateLibrary {
    id: number;
    label: string;
    description: string | null;
    url: string;
    branch: string | null;
    visibility: 'owner' | 'workspace' | 'team';
    user_id: Id | null;
    team_id: Id | null;
    group: string | null;
    repo: string | null;
    cached_at: string | null;
    last_error: string | null;
    items_count: number;
    owner: { id: string; name: string } | null;
    team: { id: string; name: string } | null;
}

export interface PrivateLibraryFormValues {
    label: string;
    url: string;
    branch: string;
    visibility: PrivateLibrary['visibility'];
    user_id: Id | null;
    team_id: Id | null;
    group: string;
}

export interface TeamOption {
    id: Id;
    name: string;
}
