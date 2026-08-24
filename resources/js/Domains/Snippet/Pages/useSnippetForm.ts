import { useCallback, useMemo, useRef, useState } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { Snippet } from '@/Domains/Snippet/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { compileNodalGraphToSnippetCode, normalizeNodalFunctionGraph } from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import { diffFunctionArgumentRenames, renameFunctionArgumentReferences } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/functionArguments';

const parseArgumentNames = (args: string) => args.split(',').map(argument => argument.trim()).filter(Boolean);

// Owns editable snippet fields and computes whether they differ from the source.
export function useSnippetForm() {
    const [active, setActive] = useState<Snippet | null>(null);
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [group, setGroup] = useState('');
    const [args, setArgs] = useState('');
    const [code, setCode] = useState('');
    const [nodalGraph, setNodalGraph] = useState<NodalGraph>(() => normalizeNodalFunctionGraph(null));
    const [isActive, setIsActive] = useState(true);
    const [scope, setScope] = useState<IntegrationScope>('owner');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [ownerId, setOwnerId] = useState<Id | null>(null);
    const [targetUserRole, setTargetUserRole] = useState<string | undefined>();
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const isInternalChange = useRef(false);
    const dirtyRef = useRef(false);

    const dirty = useMemo(() => {
        if (!active) return false;
        return (
            label !== active.label ||
            (description || '') !== (active.description || '') ||
            (group || '') !== (active.group || '') ||
            (!active.library_locked && (args || '') !== (active.args || '')) ||
            (active.snippet_type === 'code' && code !== (active.code || '')) ||
            JSON.stringify(nodalGraph) !== JSON.stringify(normalizeNodalFunctionGraph(active.nodal_graph)) ||
            isActive !== active.is_active ||
            scope !== (active.scope || 'owner') ||
            teamId !== active.team_id ||
            ownerId !== active.user_id
        );
    }, [active, args, code, description, group, isActive, label, nodalGraph, ownerId, scope, teamId]);
    dirtyRef.current = dirty;

    const syncFormState = useCallback((snippet: Snippet) => {
        isInternalChange.current = false;
        setActive(snippet);
        setLabel(snippet.label);
        setDescription(snippet.description || '');
        setGroup(snippet.group || '');
        setArgs(snippet.args || '');
        setCode(snippet.code || '');
        setNodalGraph(normalizeNodalFunctionGraph(snippet.nodal_graph));
        setIsActive(snippet.is_active);
        setScope(snippet.scope || 'owner');
        setTeamId(snippet.team_id);
        setOwnerId(snippet.user_id);
        setTargetUserRole(snippet.owner_workspace_role);
    }, []);

    const handleCodeChange = useCallback((value: string | undefined) => {
        isInternalChange.current = true;
        setCode(value ?? '');
    }, []);

    const handleArgsChange = useCallback((value: string) => {
        const previousArgs = args;
        setArgs(value);
        if (active?.snippet_type !== 'nodal') return;

        // Propagate in-place argument renames to graph expressions so
        // {{ $input.oldName }} references keep working after the rename.
        const renames = diffFunctionArgumentRenames(parseArgumentNames(previousArgs), parseArgumentNames(value));
        const nextGraph = renameFunctionArgumentReferences(nodalGraph, renames);
        if (nextGraph !== nodalGraph) setNodalGraph(nextGraph);
        setCode(compileNodalGraphToSnippetCode(nextGraph, value));
    }, [active?.snippet_type, args, nodalGraph]);

    const handleNodalGraphChange = useCallback((graph: NodalGraph) => {
        const normalized = normalizeNodalFunctionGraph(graph);
        setNodalGraph(normalized);
        setCode(compileNodalGraphToSnippetCode(normalized, args));
    }, [args]);

    const handleScopeChange = useCallback((nextScope: IntegrationScope, nextTeamId: Id | null) => {
        setScope(nextScope);
        setTeamId(nextTeamId);
    }, []);

    return {
        active,
        setActive,
        clearActive: useCallback(() => setActive(null), []),
        label,
        setLabel,
        description,
        setDescription,
        group,
        setGroup,
        args,
        setArgs: handleArgsChange,
        code,
        nodalGraph,
        isActive,
        setIsActive,
        scope,
        teamId,
        handleScopeChange,
        ownerId,
        setOwnerId,
        targetUserRole,
        setTargetUserRole,
        editorRef,
        isInternalChange,
        dirty,
        dirtyRef,
        syncFormState,
        handleCodeChange,
        handleNodalGraphChange,
    };
}

export type SnippetFormController = ReturnType<typeof useSnippetForm>;
