import type { Workspace } from '@/Domains/Workspace/types';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';

export type WorkspaceOption = Pick<Workspace, 'id' | 'name'>;

export interface UserFormData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'member';
    can_create_workspace: boolean;
    workspace_ids: Id[];
}

export interface UserModalsProps {
    showCreate: boolean;
    onCloseCreate: () => void;
    editingUser: UserWithRelations | null;
    onCloseEdit: () => void;
    wsDetailUser: UserWithRelations | null;
    onCloseWsDetail: () => void;
    flowsDetailUser: UserWithRelations | null;
    onCloseFlowsDetail: () => void;
    allWorkspaces: WorkspaceOption[];
}
