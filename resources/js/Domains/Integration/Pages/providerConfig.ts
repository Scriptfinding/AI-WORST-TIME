import type { IntegrationCategory, IntegrationProvider } from '@/Domains/Integration/types';

export interface ProviderField {
    key: string;
    label: string;
    placeholder: string;
    type?: 'text' | 'password' | 'url';
    required?: boolean;
    copyValue?: boolean;
    hint?: string;
}

export interface SetupGuide {
    title: string;
    steps: string[];
}

export interface ExternalAppConfig {
    manifestUrl: string;
    storePendingNameUrl: string;
}

export interface ProviderConfig {
    provider: IntegrationProvider;
    label: string;
    typeLabel: string;
    category: IntegrationCategory;
    comingSoon?: boolean;
    icon: string;
    color: string;
    darkColor?: string;
    /** Config for providers that use an external app manifest flow */
    externalAppFlow?: ExternalAppConfig;
    /** If true, uses the Mailbox domain management flow */
    mailboxFlow?: boolean;
    /** If true, uses the AI credential and model allowlist flow */
    aiFlow?: boolean;
    fields: ProviderField[];
    testConnectionBeforeCreate?: boolean;
    hint?: string;
    docUrl?: string;
    docLabel?: string;
    setupGuide?: SetupGuide;
}

export const PROVIDERS: ProviderConfig[] = [
    {
        provider: 'openai',
        label: 'OpenAI',
        typeLabel: 'AI Provider',
        category: 'ai',
        icon: 'simple-icons:openai',
        color: '#10a37f',
        aiFlow: true,
        fields: [{ key: 'api_key', label: 'API Key', placeholder: 'sk-...', type: 'password', required: true }],
        docUrl: 'https://platform.openai.com/api-keys',
        docLabel: 'OpenAI API keys',
    },
    {
        provider: 'gemini',
        label: 'Gemini',
        typeLabel: 'AI Provider',
        category: 'ai',
        icon: 'simple-icons:googlegemini',
        color: '#4285f4',
        aiFlow: true,
        fields: [{ key: 'api_key', label: 'API Key', placeholder: 'AIza...', type: 'password', required: true }],
        docUrl: 'https://aistudio.google.com/app/apikey',
        docLabel: 'Google AI Studio API keys',
    },
    {
        provider: 'anthropic',
        label: 'Claude',
        typeLabel: 'AI Provider',
        category: 'ai',
        icon: 'simple-icons:claude',
        color: '#d97757',
        aiFlow: true,
        fields: [{ key: 'api_key', label: 'API Key', placeholder: 'sk-ant-...', type: 'password', required: true }],
        docUrl: 'https://console.anthropic.com/settings/keys',
        docLabel: 'Anthropic API keys',
    },
    {
        provider: 'mistral',
        label: 'Mistral',
        typeLabel: 'AI Provider',
        category: 'ai',
        icon: 'simple-icons:mistralai',
        color: '#f7d046',
        aiFlow: true,
        fields: [{ key: 'api_key', label: 'API Key', placeholder: 'Mistral API key', type: 'password', required: true }],
        docUrl: 'https://console.mistral.ai/api-keys',
        docLabel: 'Mistral API keys',
    },
    {
        provider: 'github',
        label: 'GitHub',
        typeLabel: 'Git Provider',
        category: 'repository',
        icon: 'mdi:github',
        color: '#24292f',
        darkColor: '#f0f0f0',
        externalAppFlow: {
            manifestUrl: '/integrations/github/manifest',
            storePendingNameUrl: '/integrations/github/store-pending-name',
        },
        fields: [],
    },
    {
        provider: 'gitlab',
        label: 'GitLab',
        typeLabel: 'Git Provider',
        category: 'repository',
        icon: 'logos:gitlab-icon',
        color: '#FC6D26',
        fields: [
            { key: 'base_url', label: 'GitLab URL', placeholder: 'https://gitlab.com', type: 'url', required: true },
            { key: 'internal_url', label: 'Internal URL (Optional)', placeholder: 'http://gitlab:80', type: 'url', required: false, hint: 'Use when GitLab runs on the same network as Puppetflow and OAuth token exchange should use an internal URL.' },
            { key: 'redirect_uri', label: 'Redirect URI', placeholder: '/integrations/gitlab/callback', type: 'url', required: true, copyValue: true, hint: 'Copy this exact URL into your GitLab application settings.' },
            { key: 'application_id', label: 'Application ID', placeholder: 'Application ID', type: 'text', required: true },
            { key: 'application_secret', label: 'Application Secret', placeholder: 'Application Secret', type: 'password', required: true },
            { key: 'group_names', label: 'Group Name (Optional)', placeholder: 'my-org, another-group', type: 'text', required: false, hint: 'For organization or group access, use the group slug, for example: my-org. Separate multiple groups with commas. Leave empty to list all repositories accessible by the connected account.' },
            { key: 'webhook_secret', label: 'Webhook Secret Token', placeholder: 'Use a high-entropy secret', type: 'password', required: true, hint: 'After saving, copy the integration-specific webhook URL and configure it with this token in GitLab.' },
        ],
        setupGuide: {
            title: 'How to create a GitLab application',
            steps: [
                'Go to your GitLab profile settings',
                'Navigate to <strong>Access</strong> then <strong>Applications</strong>',
                'Create a new application named <strong>Puppetflow</strong>',
                'Set <strong>Redirect URI</strong> to the value shown in the form below',
                'Enable the scopes: <code>read_api</code>, <code>read_user</code> and <code>read_repository</code>',
                'After creating it, copy the <strong>Application ID</strong> and <strong>Secret</strong>, then paste them below',
            ],
        },
        hint: 'After saving the integration, authorize Puppetflow on GitLab from the integration card to finish connecting your account.',
    },
    {
        provider: 'bitbucket',
        label: 'Bitbucket',
        typeLabel: 'Git Provider',
        category: 'repository',
        icon: 'logos:bitbucket',
        color: '#0052CC',
        fields: [
            { key: 'username', label: 'Bitbucket Username', placeholder: 'your-username', type: 'text', required: true },
            { key: 'email', label: 'Bitbucket Email', placeholder: 'you@example.com', type: 'text', required: true, hint: 'Use the Atlassian account email that owns the API token.' },
            { key: 'api_token', label: 'API Token', placeholder: 'Paste your Bitbucket API token', type: 'password', required: true },
            { key: 'workspace_name', label: 'Workspace Name (Optional)', placeholder: 'my-org', type: 'text', required: false, hint: 'For organization accounts, use the workspace slug. Leave empty to list all repositories accessible by the connected account.' },
            { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'Use a high-entropy secret', type: 'password', required: true, hint: 'After saving, copy the integration-specific webhook URL and configure it with this secret in Bitbucket.' },
        ],
        setupGuide: {
            title: 'How to create a Bitbucket API token',
            steps: [
                'Use a Bitbucket API Token.',
                'Open <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank">Atlassian API tokens</a>',
                'Click <strong>Create API token</strong> and select an expiration date, maximum 1 year',
                'Select the <strong>Bitbucket</strong> product',
                'Select the scopes: <code>read:repository:bitbucket</code>, <code>read:pullrequest:bitbucket</code>, <code>read:webhook:bitbucket</code>, <code>read:workspace:bitbucket</code> and <code>write:webhook:bitbucket</code>',
                'Paste the generated token below',
            ],
        },
    },
    {
        provider: 'gitea',
        label: 'Gitea',
        typeLabel: 'Git Provider',
        category: 'repository',
        icon: 'simple-icons:gitea',
        color: '#609926',
        fields: [
            { key: 'base_url', label: 'Gitea URL', placeholder: 'https://gitea.com', type: 'url', required: true },
            { key: 'internal_url', label: 'Internal URL (Optional)', placeholder: 'http://gitea:3000', type: 'url', required: false, hint: 'Use when Gitea runs on the same network as Puppetflow and OAuth token exchange should use an internal URL.' },
            { key: 'redirect_uri', label: 'Redirect URI', placeholder: '/integrations/gitea/callback', type: 'url', required: true, copyValue: true, hint: 'Copy this exact URL into your Gitea OAuth2 application settings.' },
            { key: 'client_id', label: 'Client ID', placeholder: 'Client ID', type: 'text', required: true },
            { key: 'client_secret', label: 'Client Secret', placeholder: 'Client Secret', type: 'password', required: true },
            { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'Use a high-entropy secret', type: 'password', required: true, hint: 'After saving, copy the integration-specific webhook URL and configure it with this secret in Gitea.' },
        ],
        setupGuide: {
            title: 'How to create a Gitea OAuth2 application',
            steps: [
                'Go to your Gitea settings',
                'Navigate to <strong>Applications</strong> then <strong>Create new OAuth2 Application</strong>',
                'Create a new application named <strong>Puppetflow</strong>',
                'Set <strong>Redirect URI</strong> to the value shown in the form below',
                'After creating it, copy the <strong>Client ID</strong> and <strong>Client Secret</strong>, then paste them below',
            ],
        },
        hint: 'After saving the integration, authorize Puppetflow on Gitea from the integration card to finish connecting your account.',
    },
    {
        provider: 'onepassword',
        label: '1Password',
        typeLabel: 'Secret Manager',
        category: 'vault',
        icon: 'simple-icons:1password',
        color: '#0572ec',
        fields: [
            { key: 'server_url', label: 'Connect Server URL', placeholder: 'http://localhost:8080', type: 'url', required: true, hint: 'URL of your 1Password Connect server.' },
            { key: 'token', label: 'Connect Token', placeholder: 'eyJhbGciOi...', type: 'password', required: true },
        ],
        hint: '',
        docUrl: 'https://developer.1password.com/docs/connect/get-started/',
        docLabel: 'How to set up a Connect server',
    },
    {
        provider: 'hashicorp_vault',
        label: 'HashiCorp Vault',
        typeLabel: 'Secret Manager',
        category: 'vault',
        comingSoon: true,
        icon: 'simple-icons:hashicorp',
        color: '#000000',
        darkColor: '#ffffff',
        fields: [
            { key: 'server_url', label: 'Vault Server URL', placeholder: 'https://vault.example.com', type: 'url', required: true },
            { key: 'token', label: 'Vault Token', placeholder: 'hvs...', type: 'password', required: true },
            { key: 'namespace', label: 'Namespace (Optional)', placeholder: 'admin', type: 'text', hint: 'Use for Vault Enterprise namespaces.' },
            { key: 'mount', label: 'KV v2 Mount (Optional)', placeholder: 'secret', type: 'text', hint: 'Defaults to secret.' },
        ],
        docUrl: 'https://developer.hashicorp.com/vault/docs/secrets/kv',
        docLabel: 'HashiCorp Vault KV documentation',
    },
    {
        provider: 'aws_secrets_manager',
        label: 'AWS Secrets Manager',
        typeLabel: 'Secret Manager',
        category: 'vault',
        comingSoon: true,
        icon: 'simple-icons:amazon',
        color: '#ff9900',
        fields: [
            { key: 'region', label: 'Region', placeholder: 'eu-west-3', type: 'text', required: true },
            { key: 'access_key_id', label: 'Access Key ID', placeholder: 'AKIA...', type: 'text', required: true },
            { key: 'secret_access_key', label: 'Secret Access Key', placeholder: '••••••••••••••••', type: 'password', required: true },
            { key: 'session_token', label: 'Session Token (Optional)', placeholder: 'Session token', type: 'password' },
        ],
        docUrl: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html',
        docLabel: 'AWS Secrets Manager documentation',
    },
    {
        provider: 'azure_key_vault',
        label: 'Azure Key Vault',
        typeLabel: 'Secret Manager',
        category: 'vault',
        comingSoon: true,
        icon: 'simple-icons:microsoftazure',
        color: '#0078d4',
        fields: [
            { key: 'vault_url', label: 'Vault URL', placeholder: 'https://my-vault.vault.azure.net', type: 'url', required: true },
            { key: 'tenant_id', label: 'Tenant ID', placeholder: '00000000-0000-0000-0000-000000000000', type: 'text', required: true },
            { key: 'client_id', label: 'Client ID', placeholder: '00000000-0000-0000-0000-000000000000', type: 'text', required: true },
            { key: 'client_secret', label: 'Client Secret', placeholder: '••••••••••••••••', type: 'password', required: true },
        ],
        docUrl: 'https://learn.microsoft.com/en-us/azure/key-vault/secrets/',
        docLabel: 'Azure Key Vault Secrets documentation',
    },
    {
        provider: 'slack',
        label: 'Slack',
        typeLabel: 'Messenger Bot',
        category: 'messenger',
        icon: 'logos:slack-icon',
        color: '#E01E5A',
        fields: [
            { key: 'token', label: 'Bot Token', placeholder: 'xoxb-...', type: 'password', required: true, hint: 'OAuth token with chat:write and channels:read scopes.' },
        ],
        setupGuide: {
            title: 'How to create a Slack bot',
            steps: [
                'Go to <a href="https://api.slack.com/apps" target="_blank">Slack API Apps</a> and click <strong>Create New App</strong>',
                'Choose <strong>From scratch</strong>, name your app and select a workspace',
                'Go to <strong>OAuth & Permissions</strong> and add the bot scopes: <code>chat:write</code>, <code>channels:read</code> and <code>groups:read</code>',
                'Reload page then click <strong>Install to Workspace</strong> and copy the <strong>Bot User OAuth Token</strong>',
                'Paste the token in the field in previous window',
            ],
        },
    },
    {
        provider: 'discord',
        label: 'Discord',
        typeLabel: 'Messenger Bot',
        category: 'messenger',
        icon: 'simple-icons:discord',
        color: '#5865F2',
        fields: [
            { key: 'token', label: 'Bot Token', placeholder: 'MTExNjQ5...', type: 'password', required: true, hint: 'From the Discord Developer Portal > Bot > Token.' },
        ],
        setupGuide: {
            title: 'How to create a Discord bot',
            steps: [
                'Go to the <a href="https://discord.com/developers/applications" target="_blank">Discord Developer Portal</a>',
                'Create a <strong>New Application</strong>, then go to the <strong>Bot</strong> tab',
                'Click <strong>Reset Token</strong> and copy the bot token',
                'Paste the token in previous window',
            ],
        },
    },
    {
        provider: 'telegram',
        label: 'Telegram',
        typeLabel: 'Messenger Bot',
        category: 'messenger',
        icon: 'mdi:telegram',
        color: '#26A5E4',
        fields: [
            { key: 'token', label: 'Bot Token', placeholder: '123456:ABC-DEF1234...', type: 'password', required: true, hint: 'Get it from @BotFather on Telegram.' },
        ],
        setupGuide: {
            title: 'How to create a Telegram bot',
            steps: [
                'Open <a href="https://t.me/BotFather" target="_blank">@BotFather</a> in Telegram',
                'Send the <code>/newbot</code> command',
                'Choose a display name and a unique username ending with <code>bot</code>',
                'BotFather will give you a <strong>bot token</strong> like <code>123456:ABC-DEF1234...</code>',
                'Copy the token and paste it in previous window',
            ],
        },
    },
    {
        provider: 'mailbox',
        label: 'Mailbox',
        typeLabel: 'Email Receiver',
        category: 'other',
        icon: 'lucide:mail',
        color: '#6366f1',
        mailboxFlow: true,
        fields: [],
    },
];

export function getProviderConfig(provider: IntegrationProvider): ProviderConfig | undefined {
    return PROVIDERS.find(p => p.provider === provider);
}

export function getProvidersByCategory(category: IntegrationCategory): ProviderConfig[] {
    return PROVIDERS.filter(p => p.category === category);
}
