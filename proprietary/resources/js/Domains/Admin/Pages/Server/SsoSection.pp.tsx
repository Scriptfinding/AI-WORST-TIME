import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input, { Select, TextArea } from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import Switch from '@/Shared/UI/Switch/Switch';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import WorkspacePicker from '@/Domains/Admin/Pages/Users/UserModals/WorkspacePicker/WorkspacePicker';
import type { WorkspaceOption } from '@/Domains/Admin/Pages/Users/UserModals/types';
import type {
    SsoProvider,
    SsoProviderType,
    SsoSettings,
} from '@/Domains/Admin/Pages/Server/types';
import * as S from './SsoSection.styled.pp';

type Config = Record<string, string>;
type Action = 'test' | 'toggle' | null;
type ProvisioningMode = 'auto_join' | 'approval';
type TestResult = { status: 'success' | 'error'; message: string } | null;

interface ProviderCardProps {
    type: SsoProviderType;
    provider: SsoProvider | null;
    workspaces: WorkspaceOption[];
}

interface Field {
    key: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    secretConfigured?: boolean;
    textarea?: boolean;
    type?: React.HTMLInputTypeAttribute;
}

function configValue(provider: SsoProvider | null, key: string, fallback = ''): string {
    const value = provider?.config[key];
    return value == null ? fallback : String(value);
}

function initialWorkspaceIds(provider: SsoProvider | null): Id[] {
    const value = provider?.config.workspace_ids;
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
}

function initialConfig(type: SsoProviderType, provider: SsoProvider | null): Config {
    if (type === 'saml') {
        return {
            metadata_url: configValue(provider, 'metadata_url'),
            metadata_xml: '',
            idp_entity_id: configValue(provider, 'idp_entity_id'),
            idp_sso_url: configValue(provider, 'idp_sso_url'),
            idp_certificate: '',
            sp_certificate: '',
            sp_private_key: '',
            email_attribute: configValue(provider, 'email_attribute', 'email'),
            first_name_attribute: configValue(provider, 'first_name_attribute', 'firstName'),
            last_name_attribute: configValue(provider, 'last_name_attribute', 'lastName'),
            subject_attribute: configValue(provider, 'subject_attribute'),
        };
    }

    return {
        host: configValue(provider, 'host'),
        port: configValue(provider, 'port', '636'),
        tls_mode: configValue(provider, 'tls_mode', 'ldaps'),
        base_dn: configValue(provider, 'base_dn'),
        bind_dn: configValue(provider, 'bind_dn'),
        bind_password: '',
        login_attribute: configValue(provider, 'login_attribute', 'mail'),
        user_filter: configValue(provider, 'user_filter'),
        id_attribute: configValue(provider, 'id_attribute', 'entryUUID'),
        email_attribute: configValue(provider, 'email_attribute', 'mail'),
        name_attribute: configValue(provider, 'name_attribute', 'displayName'),
    };
}

function secretPlaceholder(configured: boolean | undefined): string {
    return configured ? 'Configured. Leave blank to keep it' : 'Enter a value';
}

function ProviderCard({ type, provider, workspaces }: ProviderCardProps) {
    const isSaml = type === 'saml';
    const appOrigin = typeof window === 'undefined' ? '' : window.location.origin;
    const [name, setName] = useState(provider?.name ?? (isSaml ? 'Company SAML' : 'Company LDAP'));
    const [jitEnabled, setJitEnabled] = useState(provider?.jit_enabled ?? true);
    const [provisioningMode, setProvisioningMode] = useState<ProvisioningMode>(
        configValue(provider, 'provisioning_mode', 'auto_join') === 'approval' ? 'approval' : 'auto_join',
    );
    const [workspaceIds, setWorkspaceIds] = useState<Id[]>(() => initialWorkspaceIds(provider));
    const [config, setConfig] = useState<Config>(() => initialConfig(type, provider));
    const [action, setAction] = useState<Action>(null);
    const [error, setError] = useState('');
    const [testResult, setTestResult] = useState<TestResult>(null);
    const [configurationOpen, setConfigurationOpen] = useState(provider?.is_enabled ?? false);
    const workspaceSelectionRequired = jitEnabled && provisioningMode === 'auto_join' && workspaceIds.length === 0;

    useEffect(() => {
        setName(provider?.name ?? (isSaml ? 'Company SAML' : 'Company LDAP'));
        setJitEnabled(provider?.jit_enabled ?? true);
        setProvisioningMode(
            configValue(provider, 'provisioning_mode', 'auto_join') === 'approval' ? 'approval' : 'auto_join',
        );
        setWorkspaceIds(initialWorkspaceIds(provider));
        setConfig(initialConfig(type, provider));
        if (provider?.is_enabled) setConfigurationOpen(true);
    }, [isSaml, provider, type]);

    const setValue = (key: string, value: string) => {
        setConfig(current => ({ ...current, [key]: value }));
    };

    const setTlsMode = (mode: string) => {
        setConfig(current => {
            const currentDefaultPort = current.tls_mode === 'ldaps' ? '636' : '389';
            const nextDefaultPort = mode === 'ldaps' ? '636' : '389';

            return {
                ...current,
                tls_mode: mode,
                port: current.port === currentDefaultPort ? nextDefaultPort : current.port,
            };
        });
    };

    const setProviderEnabled = (enabled: boolean, afterValidation = false) => {
        router.patch(`/admin/server/sso/${type}`, { is_enabled: enabled }, {
            preserveScroll: true,
            onStart: () => setAction(afterValidation ? 'test' : 'toggle'),
            onSuccess: () => {
                setError('');
                if (afterValidation) {
                    setTestResult({
                        status: 'success',
                        message: `${type.toUpperCase()} configuration validated and enabled.`,
                    });
                }
            },
            onError: (errors: Record<string, string>) => {
                const message = Object.values(errors)[0] ?? 'Unable to update this provider.';
                setConfigurationOpen(provider?.is_enabled ?? false);
                if (afterValidation) {
                    setTestResult({ status: 'error', message });
                } else {
                    setError(message);
                }
            },
            onFinish: () => setAction(null),
        });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const url = `/admin/server/sso/${type}/test`;
        const data = {
            name: name.trim(),
            jit_enabled: jitEnabled,
            config: {
                ...config,
                provisioning_mode: provisioningMode,
                workspace_ids: workspaceIds,
            },
        };
        const options = {
            preserveScroll: true,
            onStart: () => {
                setAction('test');
                setTestResult(null);
            },
            onSuccess: () => {
                setError('');
                setProviderEnabled(true, true);
            },
            onError: (errors: Record<string, string>) => {
                const message = Object.values(errors)[0] ?? 'Unable to save this provider.';
                setError('');
                setTestResult({ status: 'error', message });
            },
            onFinish: () => setAction(null),
        };

        router.post(url, data, options);
    };

    const toggleConfiguration = (enabled: boolean) => {
        setConfigurationOpen(enabled);
        setError('');

        if (!enabled && provider?.is_enabled) {
            setProviderEnabled(false);
        } else if (enabled && provider?.validated_at && !provider.is_enabled) {
            setProviderEnabled(true);
        }
    };

    const samlIdentityFields: Field[] = [
        { key: 'idp_entity_id', label: 'IDP Entity ID', placeholder: 'https://idp.example.com/entity' },
        { key: 'idp_sso_url', label: 'IDP Redirect URL', placeholder: 'https://idp.example.com/sso', type: 'url' },
        {
            key: 'idp_certificate',
            label: 'IDP certificate',
            textarea: true,
            secretConfigured: provider?.idp_certificate_configured,
        },
    ];
    const samlSpFields: Field[] = [
        {
            key: 'sp_certificate',
            label: 'SP certificate',
            textarea: true,
            secretConfigured: provider?.sp_certificate_configured,
        },
        {
            key: 'sp_private_key',
            label: 'SP private key',
            textarea: true,
            secretConfigured: provider?.sp_private_key_configured,
        },
    ];
    const samlAttributeFields: Field[] = [
        { key: 'email_attribute', label: 'Email attribute', required: true },
        { key: 'first_name_attribute', label: 'First name attribute' },
        { key: 'last_name_attribute', label: 'Last name attribute' },
        { key: 'subject_attribute', label: 'Subject attribute', placeholder: 'Defaults to NameID' },
    ];
    const ldapConnectionFields: Field[] = [
        { key: 'host', label: 'Host', required: true, placeholder: 'ldap.example.com' },
        { key: 'port', label: 'Port', required: true, type: 'number' },
        { key: 'base_dn', label: 'Base DN', required: true, placeholder: 'dc=example,dc=com' },
        { key: 'bind_dn', label: 'Bind DN', required: true, placeholder: 'cn=reader,dc=example,dc=com' },
        {
            key: 'bind_password',
            label: 'Bind password',
            type: 'password',
            secretConfigured: provider?.bind_password_configured,
        },
        { key: 'user_filter', label: 'Additional user filter', placeholder: '(objectClass=inetOrgPerson)' },
    ];
    const ldapAttributeFields: Field[] = [
        { key: 'login_attribute', label: 'Login attribute', required: true },
        { key: 'id_attribute', label: 'Stable ID attribute', required: true },
        { key: 'email_attribute', label: 'Email attribute', required: true },
        { key: 'name_attribute', label: 'Name attribute', required: true },
    ];

    const renderFields = (fields: Field[]) => (
        <S.FormGrid>
            {fields.map(field => {
                const control = field.textarea ? (
                    <TextArea
                        label={field.label}
                        value={config[field.key]}
                        required={field.required}
                        rows={4}
                        maxLength={20000}
                        placeholder={field.secretConfigured !== undefined
                            ? secretPlaceholder(field.secretConfigured)
                            : field.placeholder}
                        onChange={event => setValue(field.key, event.target.value)}
                    />
                ) : (
                    <Input
                        label={field.label}
                        value={config[field.key]}
                        required={field.required}
                        type={field.type ?? 'text'}
                        min={field.key === 'port' ? 1 : undefined}
                        max={field.key === 'port' ? 65535 : undefined}
                        maxLength={field.key === 'bind_password'
                            ? 10000
                            : field.key.includes('dn')
                                || field.key === 'user_filter'
                                || field.key === 'idp_entity_id'
                                || field.key === 'idp_sso_url'
                                ? 2048
                                : 255}
                        pattern={!isSaml && ['login_attribute', 'id_attribute', 'email_attribute', 'name_attribute'].includes(field.key)
                            ? '[a-zA-Z][a-zA-Z0-9.-]*'
                            : undefined}
                        placeholder={field.secretConfigured !== undefined
                            ? secretPlaceholder(field.secretConfigured)
                            : field.placeholder}
                        onChange={event => setValue(field.key, event.target.value)}
                    />
                );
                return field.textarea || field.key === 'base_dn' || field.key === 'bind_dn' || field.key === 'user_filter'
                    ? <S.FullField key={field.key}>{control}</S.FullField>
                    : <React.Fragment key={field.key}>{control}</React.Fragment>;
            })}
        </S.FormGrid>
    );

    return (
        <>
        <S.Card>
            <S.Header>
                <S.Heading>
                    <S.IconBox>
                        <Icon icon={isSaml ? 'lucide:badge-check' : 'lucide:network'} width={19} />
                    </S.IconBox>
                    <div>
                        <S.Title>{isSaml ? 'SAML 2.0' : 'LDAP'}</S.Title>
                        <S.Description>
                            {isSaml
                                ? 'Authenticate through your identity provider.'
                                : 'Authenticate against your organization directory.'}
                        </S.Description>
                    </div>
                </S.Heading>
                <S.HeaderToggle>
                    <span>Activate</span>
                    <Switch
                        checked={configurationOpen}
                        disabled={action !== null}
                        onChange={toggleConfiguration}
                        ariaLabel={`${configurationOpen ? 'Disable' : 'Enable'} ${type.toUpperCase()} provider`}
                    />
                </S.HeaderToggle>
            </S.Header>

            {configurationOpen && <S.Form onSubmit={submit}>
                {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
                <S.FormGrid>
                    <S.FullField>
                        <Input
                            label="Provider name"
                            value={name}
                            required
                            maxLength={255}
                            onChange={event => setName(event.target.value)}
                        />
                    </S.FullField>
                </S.FormGrid>

                {isSaml ? (
                    <>
                        <S.Group>
                            <S.GroupTitle>Service provider endpoints</S.GroupTitle>
                            <S.FormGrid>
                                <S.FullField>
                                    <Input
                                        label="SP ACS URL"
                                        value={`${appOrigin}/sso/saml/acs`}
                                        readOnly
                                    />
                                </S.FullField>
                                <S.FullField>
                                    <Input
                                        label="SP Entity ID"
                                        value={`${appOrigin}/sso/saml/metadata`}
                                        readOnly
                                    />
                                </S.FullField>
                            </S.FormGrid>
                        </S.Group>
                        <S.Group>
                            <S.GroupTitle>Metadata import</S.GroupTitle>
                            <S.FormGrid>
                                <S.FullField>
                                    <Input
                                        label="Metadata URL"
                                        type="url"
                                        value={config.metadata_url}
                                        maxLength={2048}
                                        placeholder="https://idp.example.com/metadata"
                                        onChange={event => setValue('metadata_url', event.target.value)}
                                    />
                                </S.FullField>
                                <S.FullField>
                                    <TextArea
                                        label="Metadata XML"
                                        value={config.metadata_xml}
                                        rows={4}
                                        maxLength={2000000}
                                        placeholder="Paste metadata XML to import it"
                                        onChange={event => setValue('metadata_xml', event.target.value)}
                                    />
                                </S.FullField>
                            </S.FormGrid>
                        </S.Group>
                        <S.Group>
                            <S.GroupTitle>Identity provider</S.GroupTitle>
                            {renderFields(samlIdentityFields)}
                        </S.Group>
                        <S.Group>
                            <S.GroupTitle>Service provider signing</S.GroupTitle>
                            {renderFields(samlSpFields)}
                        </S.Group>
                        <S.Group>
                            <S.GroupTitle>Attribute mapping</S.GroupTitle>
                            {renderFields(samlAttributeFields)}
                        </S.Group>
                    </>
                ) : (
                    <>
                        <S.Group>
                            <S.GroupTitle>Directory connection</S.GroupTitle>
                            <S.FormGrid>
                                <Select
                                    label="TLS mode"
                                    value={config.tls_mode}
                                    options={[
                                        { value: 'ldaps', label: 'LDAPS' },
                                        { value: 'starttls', label: 'StartTLS' },
                                        { value: 'plain', label: 'LDAP without TLS' },
                                    ]}
                                    onChange={event => setTlsMode(event.target.value)}
                                />
                            </S.FormGrid>
                            {config.tls_mode === 'plain' && (
                                <S.WarningMessage>
                                    The bind password and user credentials will be sent without encryption.
                                    Only use this mode on a trusted private network.
                                </S.WarningMessage>
                            )}
                            {renderFields(ldapConnectionFields)}
                        </S.Group>
                        <S.Group>
                            <S.GroupTitle>Attribute mapping</S.GroupTitle>
                            {renderFields(ldapAttributeFields)}
                        </S.Group>
                    </>
                )}

                <S.Group>
                    <S.ToggleRow>
                        <S.ToggleCopy>
                            <S.ToggleLabel>Just-in-time provisioning</S.ToggleLabel>
                            <S.ToggleHint>Create a local account when a new directory user signs in.</S.ToggleHint>
                        </S.ToggleCopy>
                        <Switch
                            checked={jitEnabled}
                            onChange={setJitEnabled}
                            ariaLabel={`Enable ${type.toUpperCase()} just-in-time provisioning`}
                        />
                    </S.ToggleRow>
                    {jitEnabled && (
                        <S.ProvisioningPanel>
                            <Select
                                label="New user workspace access"
                                value={provisioningMode}
                                options={[
                                    { value: 'auto_join', label: 'Join selected workspaces automatically' },
                                    { value: 'approval', label: 'Require administrator approval' },
                                ]}
                                onChange={event => setProvisioningMode(event.target.value as ProvisioningMode)}
                            />
                            {provisioningMode === 'auto_join' ? (
                                <S.WorkspaceField>
                                    <S.FieldLabel>Workspaces</S.FieldLabel>
                                    <WorkspacePicker
                                        workspaces={workspaces}
                                        selectedIds={workspaceIds}
                                        error={workspaceSelectionRequired}
                                        onToggle={id => setWorkspaceIds(current =>
                                            current.includes(id)
                                                ? current.filter(workspaceId => workspaceId !== id)
                                                : [...current, id])}
                                    />
                                    {workspaceSelectionRequired
                                        ? <S.FieldError>Select at least one workspace.</S.FieldError>
                                        : <S.FieldHint>New users join these workspaces as members. No personal workspace is created.</S.FieldHint>}
                                </S.WorkspaceField>
                            ) : (
                                <S.FieldHint>
                                    The first login creates an invitation request. A Puppetflow or workspace administrator must approve it.
                                </S.FieldHint>
                            )}
                        </S.ProvisioningPanel>
                    )}
                </S.Group>

                <S.Footer>
                    <div>
                        {provider?.validated_at && (
                            <S.Validation>
                                Last validated {formatDateTime(provider.validated_at)}
                            </S.Validation>
                        )}
                    </div>
                    <S.Actions>
                        <Button
                            type="submit"
                            size="sm"
                            loading={action === 'test'}
                            disabled={!name.trim() || workspaceSelectionRequired}
                        >
                            <Icon icon="lucide:flask-conical" width={13} />
                            Test &amp; Save
                        </Button>
                    </S.Actions>
                </S.Footer>
            </S.Form>}
        </S.Card>
        <Modal
            isOpen={testResult !== null}
            onClose={() => setTestResult(null)}
            title={`${type.toUpperCase()} validation ${testResult?.status === 'success' ? 'successful' : 'failed'}`}
            width="440px"
            footer={<Button size="sm" onClick={() => setTestResult(null)}>OK</Button>}
        >
            {testResult && (
                <S.TestResultMessage $status={testResult.status}>
                    <Icon
                        icon={testResult.status === 'success' ? 'lucide:circle-check' : 'lucide:circle-x'}
                        width={20}
                        height={20}
                    />
                    <span>{testResult.message}</span>
                </S.TestResultMessage>
            )}
        </Modal>
        </>
    );
}

export default function SsoSection({ sso, workspaces }: { sso: SsoSettings; workspaces: WorkspaceOption[] }) {
    return (
        <S.Section>
            <S.Intro>
                Activate a provider, configure it, then save and test it to enable sign-in.
            </S.Intro>
            <S.Cards>
                <ProviderCard type="saml" provider={sso.saml} workspaces={workspaces} />
                <ProviderCard type="ldap" provider={sso.ldap} workspaces={workspaces} />
            </S.Cards>
        </S.Section>
    );
}
