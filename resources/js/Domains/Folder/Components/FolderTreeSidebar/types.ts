import type { Flow } from '@/Domains/Flow/types';

export type SidebarFlow = Pick<
    Flow,
    | 'id'
    | 'id'
    | 'name'
    | 'visibility'
    | 'folder_id'
    | 'workspace_folder_id'
    | 'owner_id'
    | 'team_id'
    | 'owner_workspace_role'
    | 'icon_type'
    | 'icon_value'
    | 'icon_color'
    | 'icon_url'
    | 'library_locked'
    | 'library_reference'
>;
