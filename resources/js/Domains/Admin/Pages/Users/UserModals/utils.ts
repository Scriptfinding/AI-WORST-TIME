import type { UserFormData } from './types';

export const emptyUserForm = (): UserFormData => ({
    name: '',
    email: '',
    password: '',
    role: 'member',
    can_create_workspace: true,
    workspace_ids: [],
});

export const toggleWorkspaceId = (ids: Id[], id: Id) => (
    ids.includes(id)
        ? ids.filter(workspaceId => workspaceId !== id)
        : [...ids, id]
);
