import { type Dispatch, type SetStateAction, useState } from 'react';
import type { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { useToast } from '@/App/Hooks/useToast';
import { invalidateSnippetCache } from '@/Domains/Flow/Pages/FlowEditor/utils/snippetSuggestions';
import type { Snippet } from '@/Domains/Snippet/types';
import type { SnippetFormController } from './useSnippetForm';
import { fetchJson } from './utils';

type Confirm = ReturnType<typeof useConfirm>['confirm'];
type Toast = ReturnType<typeof useToast>['toast'];

interface Options {
    form: SnippetFormController;
    setSnippets: Dispatch<SetStateAction<Snippet[]>>;
    confirm: Confirm;
    toast: Toast;
}

// Checks for library revisions and replaces a snippet with its latest source.
export function useSnippetLibraryUpdate({ form, setSnippets, confirm, toast }: Options) {
    const [updatingLibrarySource, setUpdatingLibrarySource] = useState(false);
    const [checkingLibraryUpdate, setCheckingLibraryUpdate] = useState(false);

    const handleUpdateLibrarySource = async () => {
        if (!form.active) return;
        const confirmed = await confirm({
            title: 'Update library snippet',
            message: 'This will replace the snippet type, graph, code, and arguments with the latest library version. Other settings will be kept.',
            confirmLabel: 'Update',
            variant: 'primary',
        });
        if (!confirmed) return;

        setUpdatingLibrarySource(true);
        const response = await fetchJson(`/snippets/${form.active.id}/library-update`, {
            method: 'POST',
            body: JSON.stringify({}),
        });
        if (!response.ok) {
            const error = await response.json();
            toast(error.message || 'Error updating snippet from library', 'error');
            setUpdatingLibrarySource(false);
            return;
        }

        const updated: Snippet = await response.json();
        setSnippets(previous => previous.map(snippet => snippet.id === updated.id ? updated : snippet));
        form.syncFormState(updated);
        setUpdatingLibrarySource(false);
        toast('Snippet updated from library');
        invalidateSnippetCache();
    };

    const handleCheckLibraryUpdate = async () => {
        if (!form.active) return;
        const active = form.active;

        setCheckingLibraryUpdate(true);
        try {
            const response = await fetchJson(`/snippets/${active.id}/library-check-update`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (!response.ok) {
                const error = await response.json();
                toast(error.message || 'Error checking library updates', 'error');
                return;
            }

            const data: Pick<Snippet, 'library_latest_source_sha' | 'library_update_available'> = await response.json();
            const updated = {
                ...active,
                library_latest_source_sha: data.library_latest_source_sha ?? null,
                library_update_available: Boolean(data.library_update_available),
            };
            setSnippets(previous => previous.map(snippet => snippet.id === active.id ? updated : snippet));
            form.setActive(updated);
            toast(updated.library_update_available ? 'A library update is available' : 'This snippet is up to date');
        } catch {
            toast('Error checking library updates', 'error');
        } finally {
            setCheckingLibraryUpdate(false);
        }
    };

    return {
        updatingLibrarySource,
        checkingLibraryUpdate,
        handleUpdateLibrarySource,
        handleCheckLibraryUpdate,
    };
}
