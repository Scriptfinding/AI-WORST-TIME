import type { User } from '@/App/types';
import type { Flow } from '@/Domains/Flow/types';
import type { Id } from '@/Shared/types';

export interface Folder {
    id: Id;
    name: string;
    parent_id: Id | null;
    sort_order: number;
    is_shared: boolean;
    team_id?: Id | null;
    children?: Folder[];
    owner?: Pick<User, 'id' | 'name'>;
}
export type DeletableFolder = Pick<Folder, 'id' | 'name'>;
export interface BreadcrumbSiblingFolder {
    id: Id;
    name: string;
    href: string;
}
export interface Breadcrumb {
    id: Id | null;
    name: string;
    href?: string;
    icon?: 'personal' | 'workspace' | 'team';
    team_id?: Id | null;
    is_shared?: boolean;
    siblingFolders?: BreadcrumbSiblingFolder[];
}
export type TreeFlow = Pick<Flow, 'id' | 'name' | 'visibility' | 'folder_id' | 'workspace_folder_id' | 'owner_id' | 'team_id' | 'owner_workspace_role' | 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url' | 'library_reference' | 'library_locked'>;
export interface FolderTree {
    id: Id;
    name: string;
    parent_id: Id | null;
    owner_name?: string;
    team_id?: Id | null;
    children: FolderTree[];
    flows: TreeFlow[];
}
export interface TeamTree {
    id: Id;
    name: string;
    root_folder_id: Id | null;
    tree: FolderTree[];
    rootFlows: TreeFlow[];
}
export interface UserTree {
    id: Id;
    name: string;
    tree: FolderTree[];
    rootFlows: TreeFlow[];
}
