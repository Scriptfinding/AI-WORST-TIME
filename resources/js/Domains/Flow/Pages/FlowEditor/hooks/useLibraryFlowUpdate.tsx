import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import type { useToast } from '@/App/Hooks/useToast';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import { refreshReferenceLabelDecorations } from '@/Domains/Flow/Pages/FlowEditor/utils/referenceLabelDecorations';

type ConfirmFn = (options: {
    title: string;
    message: ReactNode;
    confirmLabel: string;
    variant?: 'primary' | 'danger';
}) => Promise<boolean>;

type ToastFn = ReturnType<typeof useToast>['toast'];
type InputSchemaDiff = {
    added: Array<{ name: string; type: string }>;
    removed: Array<{ name: string; type: string }>;
    type_changed: Array<{ name: string; before: string; after: string }>;
    has_changes: boolean;
};

function schemaDiffMessage(diff: InputSchemaDiff): ReactNode {
    const changes = [
        ...diff.added.map(item => `${item.name}: absent → ${item.type}`),
        ...diff.removed.map(item => `${item.name}: ${item.type} → removed`),
        ...diff.type_changed.map(item => `${item.name}: ${item.before} → ${item.after}`),
    ];

    return (
        <div>
            <p>The blueprint changes the Flow Inputs schema:</p>
            <ul style={{ margin: '10px 0', paddingLeft: 20 }}>
                {changes.map(change => <li key={change}>{change}</li>)}
            </ul>
            <p>Your values are preserved only when both the name and type stay unchanged.</p>
        </div>
    );
}

// Checks library-backed flows for upstream updates and applies them with confirmation.
export function useLibraryFlowUpdate(flow: FlowEditorProps['flow'], confirm: ConfirmFn, toast: ToastFn) {
    const [updatingLibrarySource, setUpdatingLibrarySource] = useState(false);
    const [checkingLibraryUpdate, setCheckingLibraryUpdate] = useState(false);
    const [libraryUpdateAvailable, setLibraryUpdateAvailable] = useState(Boolean(flow.library_update_available));
    const [libraryLatestSourceSha, setLibraryLatestSourceSha] = useState<string | null>(flow.library_latest_source_sha ?? null);

    useEffect(() => {
        setLibraryUpdateAvailable(Boolean(flow.library_update_available));
        setLibraryLatestSourceSha(flow.library_latest_source_sha ?? null);
    }, [flow.id, flow.library_update_available, flow.library_latest_source_sha]);

    const handleUpdateLibrarySource = useCallback(async () => {
        let schemaDiff: InputSchemaDiff | null = null;
        try {
            const response = await fetch(`/flows/${flow.id}/library-check-update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({}),
            });
            if (response.ok) {
                const data = await response.json();
                schemaDiff = data.input_schema_diff ?? null;
            }
        } catch {
            // The update endpoint remains authoritative if the preview is unavailable.
        }

        if (!await confirm({
            title: 'Update library flow',
            message: schemaDiff?.has_changes
                ? schemaDiffMessage(schemaDiff)
                : 'This will replace the code with the latest library version. Triggers, input values and settings will be kept.',
            confirmLabel: 'Update',
            variant: 'primary',
        })) {
            return;
        }

        setUpdatingLibrarySource(true);
        router.post(`/flows/${flow.id}/library-update`, {}, {
            preserveState: false,
            onSuccess: () => {
                refreshReferenceLabelDecorations();
                setLibraryUpdateAvailable(false);
                toast('Flow updated from library');
            },
            onError: errors => {
                const message = Object.values(errors).find(error => typeof error === 'string');
                toast(message || 'Error updating flow from library', 'error');
            },
            onFinish: () => setUpdatingLibrarySource(false),
        });
    }, [confirm, flow.id, toast]);

    const handleCheckLibraryUpdate = useCallback(async () => {
        setCheckingLibraryUpdate(true);
        try {
            const response = await fetch(`/flows/${flow.id}/library-check-update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({}),
            });
            const data = await response.json();

            if (!response.ok) {
                toast(data.message || 'Error checking library updates', 'error');
                return;
            }

            setLibraryUpdateAvailable(Boolean(data.library_update_available));
            setLibraryLatestSourceSha(data.library_latest_source_sha ?? null);
            toast(data.library_update_available ? 'A library update is available' : 'This flow is up to date');
        } catch {
            toast('Error checking library updates', 'error');
        } finally {
            setCheckingLibraryUpdate(false);
        }
    }, [flow.id, toast]);

    return {
        updatingLibrarySource,
        checkingLibraryUpdate,
        libraryUpdateAvailable,
        libraryLatestSourceSha,
        handleUpdateLibrarySource,
        handleCheckLibraryUpdate,
    };
}
