import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { openLibraryStoreQuery, shouldOpenLibraryStoreFromQuery } from '@/Domains/Library/Components/LibraryStoreModal/LibraryStoreModal';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useToast } from '@/App/Hooks/useToast';
import { useAuth } from '@/App/Hooks/usePageProps';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import { canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import { buildLibraryCompliantCode, buildLibraryCompliantNodalSnippet } from '@/Domains/Library/Utils/libraryCodeExport';
import type { PageProps, User } from '@/App/types';
import type { Snippet } from '@/Domains/Snippet/types';
import { useSnippetCrud } from './useSnippetCrud';
import { useSnippetDirtyProtection } from './useSnippetDirtyProtection';
import { useSnippetForm } from './useSnippetForm';
import { useSnippetLibraryUpdate } from './useSnippetLibraryUpdate';
import { useSnippetNavigation } from './useSnippetNavigation';
import { downloadTextFile, getDownloadBaseName } from './utils';

export interface SnippetsProps {
    snippets: Snippet[];
    teams: { id: Id; name: string }[];
    isAdmin: boolean;
    snippetGroups?: string[];
}

// Composes snippet form, navigation, persistence, and page-level modal state.
export function useSnippetsController({
    snippets: initialSnippets,
    teams,
    isAdmin,
    snippetGroups = [],
}: SnippetsProps) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const { user } = useAuth();
    const { confirm, ConfirmModal } = useConfirm();
    const { toast } = useToast();
    const { resolved: resolvedTheme } = useThemeMode();
    const [snippets, setSnippets] = useState(initialSnippets);
    const [showLibraryStore, setShowLibraryStore] = useState(() => shouldOpenLibraryStoreFromQuery());
    const [showImportModal, setShowImportModal] = useState(false);
    const form = useSnippetForm();
    const dirtyProtection = useSnippetDirtyProtection({ dirty: form.dirty });
    const saveCurrentSnippet = useCallback(
        () => dirtyProtection.saveRef.current(),
        [dirtyProtection.saveRef],
    );
    const navigation = useSnippetNavigation({
        initialSnippets,
        confirm,
        form,
        save: saveCurrentSnippet,
    });
    const currentUserId = user?.id ?? '';
    const currentUserWorkspaceRole: User['workspace_role'] = user?.workspace_role ?? 'member';

    useEffect(() => setSnippets(initialSnippets), [initialSnippets]);

    const featureEnabled = settings.snippets_enabled;
    const canEdit = featureEnabled && (!form.active || isAdmin || form.active.user_id === currentUserId);
    const settingsReadOnly = !canEdit;
    const codeReadOnly = !canEdit || Boolean(form.active?.library_locked);
    const ownershipDisabled = form.active ? !canEditOwnership({
        currentUserId,
        currentUserWorkspaceRole,
        resourceOwnerId: form.active.user_id,
        ownerWorkspaceRole: form.active.owner_workspace_role,
    }) : false;

    const crud = useSnippetCrud({
        setSnippets,
        form,
        currentUserId: user?.id ?? null,
        currentUserWorkspaceRole,
        confirm,
        toast,
        loadSnippet: navigation.doLoadSnippet,
        clearActiveSnippet: navigation.clearActiveSnippet,
        markJustSaved: dirtyProtection.markJustSaved,
    });
    dirtyProtection.saveRef.current = crud.handleSave;
    dirtyProtection.savingRef.current = crud.saving;

    const libraryUpdate = useSnippetLibraryUpdate({ form, setSnippets, confirm, toast });
    const importGroups = useMemo(() => {
        const groups = snippets.map(snippet => snippet.group).filter(Boolean) as string[];
        return [...new Set([...snippetGroups, ...groups])].sort();
    }, [snippetGroups, snippets]);

    const openLibraryStore = useCallback(() => {
        openLibraryStoreQuery();
        setShowLibraryStore(true);
    }, []);

    const downloadSnippet = useCallback(() => {
        const baseName = getDownloadBaseName(form.label || form.active?.label || 'snippet');
        const isNodal = form.active?.snippet_type === 'nodal';
        downloadTextFile(
            `${baseName}.${isNodal ? 'json' : 'js'}`,
            isNodal ? buildLibraryCompliantNodalSnippet({
                title: form.label || form.active?.label || 'Snippet',
                description: form.description,
                args: form.args,
                graph: form.nodalGraph,
                code: form.code,
            }) : buildLibraryCompliantCode({
                title: form.label || form.active?.label || 'Snippet',
                description: form.description,
                args: form.args,
                code: form.code,
            }),
            isNodal ? 'application/json;charset=utf-8' : 'text/javascript;charset=utf-8',
        );
    }, [form.active?.label, form.active?.snippet_type, form.args, form.code, form.description, form.label, form.nodalGraph]);

    return {
        teams,
        isAdmin,
        snippetGroups,
        snippets,
        featureEnabled,
        currentUserId,
        settingsReadOnly,
        codeReadOnly,
        ownershipDisabled,
        resolvedTheme,
        form,
        navigation,
        crud,
        dirtyProtection,
        libraryUpdate,
        importGroups,
        showLibraryStore,
        setShowLibraryStore,
        showImportModal,
        setShowImportModal,
        openLibraryStore,
        downloadSnippet,
        ConfirmModal,
    };
}

export type SnippetsController = ReturnType<typeof useSnippetsController>;
