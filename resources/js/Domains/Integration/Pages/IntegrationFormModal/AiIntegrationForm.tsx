import React, { useState, type FormEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import type { Integration, IntegrationScope } from '@/Domains/Integration/types';
import type { ProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { normalizeLaravelValidationErrors } from '@/Shared/Utils/laravelValidation';
import OwnershipScopeFields from './components/OwnershipScopeFields/OwnershipScopeFields';
import ConnectionValidation, { type ConnectionResult } from './components/ConnectionValidation/ConnectionValidation';
import * as S from './shared.styled';

interface Props {
    providerConfig: ProviderConfig;
    teams: ScopeTeam[];
    integration?: Integration;
    isAdmin?: boolean;
    deletingId?: Id | null;
    onClose: () => void;
    onDelete?: (integration: Integration) => void;
    onCreated?: (integration: Integration) => void;
}

export default function AiIntegrationForm({
    providerConfig,
    teams,
    integration,
    isAdmin,
    deletingId,
    onClose,
    onDelete,
    onCreated,
}: Props) {
    const editing = Boolean(integration);
    const [name, setName] = useState(integration?.name ?? '');
    const [scope, setScope] = useState<IntegrationScope>(integration?.scope ?? 'owner');
    const [teamId, setTeamId] = useState<Id | null>(integration?.team_id ?? null);
    const [apiKey, setApiKey] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validResult, setValidResult] = useState<ConnectionResult>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const config = apiKey.trim() ? { api_key: apiKey.trim() } : {};

    const handleValidate = async () => {
        setValidating(true);
        setValidResult(null);
        try {
            const response = await fetch('/integrations/ai/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
                body: JSON.stringify({
                    provider: providerConfig.provider,
                    integration_id: integration?.id,
                    config,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            const errorValues = payload.errors && typeof payload.errors === 'object'
                ? Object.values(payload.errors as Record<string, string[]>)
                : [];
            setValidResult(response.ok
                ? { valid: true }
                : { valid: false, error: payload.message ?? errorValues[0]?.[0] ?? 'Validation failed.' });
        } catch {
            setValidResult({ valid: false, error: 'Connection failed.' });
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (
            !name.trim()
            || (!editing && (!apiKey.trim() || validResult?.valid !== true))
        ) return;
        setSubmitting(true);
        const payload = {
            name: name.trim(),
            category: 'ai',
            provider: providerConfig.provider,
            config,
            scope,
            team_id: scope === 'team' ? teamId : null,
        };
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
            onError: (nextErrors: Record<string, string>) => setErrors(nextErrors),
            onFinish: () => setSubmitting(false),
        };
        const requestPayload = payload as unknown as Parameters<typeof router.put>[1];
        if (integration) {
            router.put(`/integrations/${integration.id}`, requestPayload, options);
        } else if (onCreated) {
            setErrors({});
            try {
                const response = await fetch('/integrations', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...csrfHeaders(),
                    },
                    body: JSON.stringify(payload),
                });
                const data = await response.json().catch(() => ({})) as {
                    integration?: Integration;
                    message?: string;
                    errors?: unknown;
                };
                if (!response.ok || !data.integration) {
                    const nextErrors = normalizeLaravelValidationErrors(data.errors);
                    setErrors(Object.keys(nextErrors).length > 0
                        ? nextErrors
                        : { name: data.message || 'Unable to create the AI integration.' });
                    return;
                }
                onCreated(data.integration);
            } catch {
                setErrors({ name: 'Unable to create the AI integration.' });
            } finally {
                setSubmitting(false);
            }
        } else {
            router.post('/integrations', requestPayload, options);
        }
    };

    const disabled = integration?.is_readonly;

    return (
        <S.Form onSubmit={handleSubmit}>
            <Input
                label="AI integration name"
                value={name}
                onChange={event => setName(event.target.value)}
                error={errors.name}
                placeholder={`my-${providerConfig.provider}`}
                disabled={disabled}
                autoFocus={!editing}
            />
            <OwnershipScopeFields
                scope={scope}
                teamId={teamId}
                teams={teams}
                disabled={disabled}
                onScopeChange={(nextScope, nextTeamId) => {
                    setScope(nextScope);
                    setTeamId(nextTeamId);
                }}
            />
            <Input
                label={editing ? 'API key (leave empty to keep current)' : 'API key'}
                type="password"
                value={apiKey}
                onChange={event => {
                    setApiKey(event.target.value);
                    setValidResult(null);
                }}
                error={errors['config.api_key']}
                placeholder={providerConfig.fields[0]?.placeholder}
                disabled={disabled}
            />
            {errors.config && (
                <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 12 }}>
                    {errors.config}
                </span>
            )}
            <ConnectionValidation
                result={validResult}
                validating={validating}
                onValidate={handleValidate}
                disabled={disabled || (!editing && apiKey.trim().length < 8)}
            />
            <S.Actions>
                {integration && isAdmin && !integration.is_readonly && onDelete && (
                    <Button type="button" size="sm" variant="danger" onClick={() => onDelete(integration)} loading={deletingId === integration.id} style={{ marginRight: 'auto' }}>
                        <Icon icon="lucide:trash-2" width={14} />
                        Delete
                    </Button>
                )}
                <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                    {integration?.is_readonly ? 'Close' : 'Cancel'}
                </Button>
                {!integration?.is_readonly && (
                    <Button
                        type="submit"
                        size="sm"
                        loading={submitting}
                        disabled={!name.trim() || (!editing && (!apiKey.trim() || validResult?.valid !== true))}
                    >
                        <Icon icon={editing ? 'lucide:save' : 'lucide:plug'} width={14} />
                        {editing ? 'Save' : 'Connect'}
                    </Button>
                )}
            </S.Actions>
        </S.Form>
    );
}
