export type LibraryType = 'flow' | 'snippet';
export type SortKey = 'popular' | 'downloaded' | 'liked' | 'newest' | 'used';
export type LibraryCollection = 'flows' | 'snippets';

export interface LibraryTeamOption {
    id: Id;
    name: string;
}

export interface LibraryUseFormData {
    name: string;
    label: string;
    description: string;
    group: string;
    scope: 'owner' | 'workspace' | 'team';
    team_id: Id | null;
    owner_id: Id | null;
}

export interface LibraryStats {
    id: number | null;
    downloads_count: number;
    upvotes_count: number;
    upvoted?: boolean;
}

export type LibrarySourceKind = 'public' | 'private';

export interface LibraryStoreChild {
    key: string;
    type: LibraryType;
    namespace: string;
    reference: string;
    label: string;
    description: string | null;
    flow_type?: 'code' | 'nodal' | null;
    snippet_type?: 'code' | 'nodal' | null;
    source_path: string;
    source_url: string;
    used_count?: number;
    is_installed?: boolean;
    installed_url?: string | null;
    source_kind?: LibrarySourceKind;
    private_library_id?: number | null;
}

export interface LibraryStoreItem {
    key: string;
    type: 'blueprint';
    namespace: string;
    reference: string;
    title: string;
    label: string;
    description: string | null;
    category: string | null;
    color?: string | null;
    author_name: string | null;
    icon_url: string | null;
    source_path: string;
    source_sha: string;
    source_url: string;
    source_kind?: LibrarySourceKind;
    private_library_id?: number | null;
    private_library_label?: string | null;
    flows: LibraryStoreChild[];
    snippets: LibraryStoreChild[];
    is_installed?: boolean;
    used_count?: number;
    used_flows_count?: number;
    used_snippets_count?: number;
    stats: LibraryStats;
}
