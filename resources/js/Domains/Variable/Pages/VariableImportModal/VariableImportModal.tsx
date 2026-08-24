import React, { useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import { useResetOnOpen } from '@/Shared/Hooks/useResetOnOpen';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { ADMIN_TRANSFER_WARNING } from '@/Shared/Utils/ownershipPermissions';
import type { PageProps } from '@/App/types';
import ImportOptions from './components/ImportOptions/ImportOptions';
import ImportResultErrors from './components/ImportResultErrors/ImportResultErrors';
import SourceInput from './components/SourceInput/SourceInput';
import VariablePreview from './components/VariablePreview/VariablePreview';
import { parseImport } from './utils';
import * as S from './styled';

interface VariableImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: string[];
    teams: ScopeTeam[];
    confirm: (options: {
        title?: string;
        message: React.ReactNode;
        confirmLabel?: string;
        variant?: 'danger' | 'primary';
    }) => Promise<boolean>;
}

export default function VariableImportModal({ isOpen, onClose, groups, teams, confirm }: VariableImportModalProps) {
    const pageProps = usePage<InertiaPageProps & PageProps>().props;
    const currentUserWorkspaceRole = pageProps.auth.user?.workspace_role ?? 'member';
    const [raw, setRaw] = useState('');
    const [prefix, setPrefix] = useState('');
    const [group, setGroup] = useState('');
    const [scope, setScope] = useState('user');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [ownerId, setOwnerId] = useState<Id | null>(null);
    const [targetUserRole, setTargetUserRole] = useState<string>();
    const [showEditor, setShowEditor] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useResetOnOpen(isOpen, () => {
        setRaw('');
        setPrefix('');
        setGroup('');
        setScope('user');
        setTeamId(null);
        setOwnerId(null);
        setTargetUserRole(undefined);
        setShowEditor(false);
        setFileName(null);
        setSubmitError(null);
        setFieldErrors({});
    });

    const parsed = useMemo(() => parseImport(raw, prefix), [raw, prefix]);
    const validVariables = parsed.variables.filter(variable => !variable.error);
    const hasParseErrors = Boolean(parsed.error || parsed.variables.some(variable => variable.error));
    const showImportForm = showEditor || Boolean(fileName);

    const clearErrors = () => {
        setSubmitError(null);
        setFieldErrors({});
    };

    const handleSourceChange = (source: string, name: string | null) => {
        setRaw(source);
        setFileName(name);
        clearErrors();
    };

    const confirmOwnershipTransfer = async () => {
        if (currentUserWorkspaceRole === 'manager' && targetUserRole === 'admin' && ownerId && ownerId !== pageProps.auth.user?.id) {
            return confirm({
                title: 'Transfer ownership',
                message: ADMIN_TRANSFER_WARNING,
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }

        if (ownerId && ownerId !== pageProps.auth.user?.id && scope === 'user') {
            return confirm({
                title: 'Transfer ownership',
                message: 'These variables will have personal visibility. By transferring them to another user, you will permanently lose access to them.',
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }

        return true;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        clearErrors();

        if (!raw.trim()) {
            setSubmitError('Drop a file or paste variables before importing.');
            return;
        }
        if (hasParseErrors || validVariables.length === 0) {
            setSubmitError('Fix the parsed variables before importing.');
            return;
        }
        if (scope === 'team' && !teamId) {
            setSubmitError('Select a team for team visibility.');
            return;
        }
        if (!await confirmOwnershipTransfer()) return;

        setSubmitting(true);
        try {
            const response = await fetch('/variables/import', {
                method: 'POST',
                headers: {
                    ...csrfHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    variables: validVariables.map(({ key, value, type }) => ({ key, value, type })),
                    group,
                    scope,
                    team_id: scope === 'team' ? teamId : null,
                    ...(ownerId ? { user_id: ownerId } : {}),
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setSubmitError(data.message || 'Import failed.');
                setFieldErrors(data.errors || {});
                return;
            }

            router.reload({ only: ['variables', 'groups'] });
            onClose();
        } catch {
            setSubmitError('Import failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Variables" width="680px">
            <S.ImportForm onSubmit={handleSubmit}>
                <SourceInput
                    raw={raw}
                    fileName={fileName}
                    showEditor={showEditor}
                    hasDropError={Boolean(submitError) && !raw.trim()}
                    hasParseError={hasParseErrors}
                    onSourceChange={handleSourceChange}
                    onEditorToggle={setShowEditor}
                />

                {showImportForm && (
                    <>
                        <ImportOptions
                            prefix={prefix}
                            group={group}
                            scope={scope}
                            teamId={teamId}
                            ownerId={ownerId}
                            groups={groups}
                            teams={teams}
                            onPrefixChange={setPrefix}
                            onGroupChange={setGroup}
                            onScopeChange={(nextScope, nextTeamId) => {
                                setScope(nextScope);
                                setTeamId(nextTeamId);
                            }}
                            onOwnerChange={setOwnerId}
                            onOwnerRoleChange={setTargetUserRole}
                        />
                        {raw.trim() && <VariablePreview parsed={parsed} fieldErrors={fieldErrors} />}
                    </>
                )}

                <ImportResultErrors submitError={submitError} parseError={parsed.error} />

                <S.Footer>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={submitting} disabled={hasParseErrors || validVariables.length === 0}>
                        Import {validVariables.length > 0 ? validVariables.length : ''}
                    </Button>
                </S.Footer>
            </S.ImportForm>
        </Modal>
    );
}
