import { useEffect, useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { useToast } from '@/App/Hooks/useToast';
import type { Integration, IntegrationScope } from '@/Domains/Integration/types';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { normalizeLaravelValidationErrors } from '@/Shared/Utils/laravelValidation';
import type { ProviderConfig, ProviderField } from '@/Domains/Integration/Pages/providerConfig';
import type { ConnectionResult } from '@/Domains/Integration/Pages/IntegrationFormModal/components/ConnectionValidation/ConnectionValidation';

interface Params {
    providerConfig: ProviderConfig;
    onClose: () => void;
    onCreated?: (integration: Integration) => void;
}

function resolveFieldPlaceholder(field: ProviderField) {
    if (field.key === 'redirect_uri' && field.placeholder.startsWith('/') && typeof window !== 'undefined') {
        return `${window.location.origin}${field.placeholder}`;
    }

    return field.placeholder;
}

function getDefaultConfig(fields: ProviderField[]) {
    return fields.reduce<Record<string, string>>((defaults, field) => {
        const placeholder = resolveFieldPlaceholder(field);
        if ((field.key === 'base_url' && placeholder.startsWith('https://'))
            || (field.key === 'redirect_uri' && placeholder)) {
            defaults[field.key] = placeholder;
        }
        return defaults;
    }, {});
}

// Prepares provider defaults and enforces connection validation before creation.
export function useIntegrationCreateForm({ providerConfig, onClose, onCreated }: Params) {
    const { toast } = useToast();
    const hasFields = providerConfig.fields.length > 0;
    const requiresConnectionTest = hasFields && providerConfig.testConnectionBeforeCreate !== false;

    const [name, setName] = useState('');
    const [scope, setScope] = useState<IntegrationScope>('owner');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [config, setConfig] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validResult, setValidResult] = useState<ConnectionResult>(null);
    const [connectionTested, setConnectionTested] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);

    useEffect(() => {
        setName('');
        setScope('owner');
        setTeamId(null);
        setConfig(getDefaultConfig(providerConfig.fields));
        setErrors({});
        setValidResult(null);
        setConnectionTested(false);
    }, [providerConfig]);

    const setField = (key: string, value: string) => {
        setConfig(previous => ({ ...previous, [key]: value }));
        setErrors(previous => ({ ...previous, [key]: '' }));
        setValidResult(null);
        setConnectionTested(false);
    };

    const handleNameChange = (value: string) => {
        setName(value);
        setErrors(previous => ({ ...previous, name: '' }));
    };

    const handleScopeChange = (nextScope: IntegrationScope, nextTeamId: Id | null) => {
        setScope(nextScope);
        setTeamId(nextTeamId);
    };

    const allFieldsFilled = providerConfig.fields.every(
        field => field.required === false || config[field.key]?.trim(),
    );
    const canCreate = requiresConnectionTest
        ? connectionTested && validResult?.valid === true && name.trim().length > 0
        : name.trim().length > 0 && (!hasFields || allFieldsFilled);

    const copyFieldValue = (field: ProviderField) => {
        const value = config[field.key] || resolveFieldPlaceholder(field);
        if (!value) return;

        navigator.clipboard.writeText(value)
            .then(() => toast('Copied to clipboard'))
            .catch(() => toast('Unable to copy to clipboard', 'error'));
    };

    const handleTestConnection = async () => {
        const fieldErrors = providerConfig.fields.reduce<Record<string, string>>((nextErrors, field) => {
            if (field.required !== false && !config[field.key]?.trim()) {
                nextErrors[field.key] = `${field.label} is required.`;
            }
            return nextErrors;
        }, {});
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }

        setValidating(true);
        setValidResult(null);
        try {
            const response = await fetch(`/integrations/${providerConfig.category}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({ provider: providerConfig.provider, config }),
            });
            setValidResult(await response.json());
            setConnectionTested(true);
        } catch {
            setValidResult({ valid: false, error: 'Connection failed.' });
            setConnectionTested(true);
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!canCreate) return;

        setSubmitting(true);
        const payload = {
            name: name.trim(),
            category: providerConfig.category,
            provider: providerConfig.provider,
            config,
            scope,
            team_id: scope === 'team' ? teamId : null,
        };

        if (onCreated) {
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
                        : { name: data.message || 'Unable to create the integration.' });
                    return;
                }
                onCreated(data.integration);
            } catch {
                setErrors({ name: 'Unable to create the integration.' });
            } finally {
                setSubmitting(false);
            }
            return;
        }

        router.post('/integrations', payload, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: inertiaErrors => {
                setErrors(inertiaErrors as Record<string, string>);
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return {
        name,
        scope,
        teamId,
        config,
        errors,
        submitting,
        validating,
        validResult,
        guideOpen,
        hasFields,
        requiresConnectionTest,
        allFieldsFilled,
        canCreate,
        handleNameChange,
        handleScopeChange,
        handleTestConnection,
        handleSubmit,
        setField,
        setGuideOpen,
        resolveFieldPlaceholder,
        copyFieldValue,
    };
}
