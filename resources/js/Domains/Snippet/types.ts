import type { User } from '@/App/types';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { Id } from '@/Shared/types';

export type SnippetType = 'code' | 'nodal';

export interface Snippet {
    id: Id;
    workspace_id: Id;
    user_id: Id | null;
    label: string;
    description: string | null;
    group: string | null;
    args: string;
    code: string;
    snippet_type: SnippetType;
    nodal_graph: NodalGraph | null;
    scope: IntegrationScope;
    team_id: Id | null;
    is_active: boolean;
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
    user?: Pick<User, 'id' | 'name'>;
    team?: { id: Id; name: string } | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
    created_at: string;
    updated_at: string;
}
