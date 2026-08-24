import React, { useState, useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Input, { Select } from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import type { ExternalAppConfig, ProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import * as S from './shared.styled';

interface Props {
    providerConfig: ProviderConfig;
    externalAppConfig: ExternalAppConfig;
    onClose: () => void;
}

export default function ExternalAppCreateForm({ providerConfig, externalAppConfig, onClose }: Props) {
    const [name, setName] = useState('');
    const [target, setTarget] = useState<'personal' | 'organization'>('personal');
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }

        setCreating(true);
        try {
            const res = await fetch(externalAppConfig.manifestUrl, {
                headers: csrfHeaders(),
            });
            const data = await res.json();

            await fetch(externalAppConfig.storePendingNameUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
                body: JSON.stringify({ name: name.trim() }),
            });

            const actionUrl = target === 'organization' && orgName.trim()
                ? `https://github.com/organizations/${encodeURIComponent(orgName.trim())}/settings/apps/new`
                : data.action_url;

            const form = formRef.current;
            if (!form) return;
            form.action = `${actionUrl}?state=${data.state}`;
            (form.querySelector('input[name="manifest"]') as HTMLInputElement).value = JSON.stringify(data.manifest);
            form.submit();
        } catch {
            setCreating(false);
        }
    };

    const canSubmit = name.trim() && (target === 'personal' || orgName.trim());

    return (
        <>
            <S.Form onSubmit={handleSubmit}>
                <Input
                    label="Integration name"
                    value={name}
                    onChange={e => { setName(e.target.value); setError(''); }}
                    error={error || undefined}
                    placeholder={`my-${providerConfig.provider}`}
                    autoFocus
                />

                <Select
                    label="Install on"
                    value={target}
                    onChange={e => setTarget(e.target.value as 'personal' | 'organization')}
                    options={[
                        { value: 'personal', label: 'Personal account' },
                        { value: 'organization', label: 'Organization' },
                    ]}
                />

                {target === 'organization' && (
                    <Input
                        label="Organization name"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        placeholder="my-org"
                    />
                )}

                <S.Actions>
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" loading={creating} disabled={!canSubmit}>
                        <Icon icon={providerConfig.icon} width={14} />
                        Create {providerConfig.label} App
                    </Button>
                </S.Actions>
            </S.Form>

            <form ref={formRef} method="post" style={{ display: 'none' }}>
                <input type="hidden" name="manifest" value="" />
            </form>
        </>
    );
}
