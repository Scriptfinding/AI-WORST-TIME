export type FeatureFlagValue = boolean | number | string;

export interface ServerSettings {
    invitation_requests_enabled: boolean;
    magic_link_enabled: boolean;
}

export interface LicenseInfo {
    active: boolean;
    managed_license: boolean;
    status: string;
    message?: string;
    plan?: string;
    expires_at?: string | null;
    grace_period_hours?: number | null;
    grace_expires_at?: string | null;
    file_configured: boolean;
    file?: {
        imported_at?: string | null;
        issued_at?: string | null;
        plan?: string | null;
        reference?: string | null;
    } | null;
    feature_flags?: Record<string, FeatureFlagValue>;
    cycle?: {
        used: number;
        limit: number | null;
        exceeded: boolean;
        starts_at: string;
        ends_at: string;
    } | null;
    storage?: {
        used_bytes: number;
        limit_bytes: number | null;
    };
}

export interface AboutInfo {
    name: string;
    version: string;
}

export interface StorageInfo {
    used_bytes: number;
    total_bytes: number;
    free_bytes: number | null;
    percentage: number;
}

export type SsoProviderType = 'saml' | 'ldap';

export interface SsoProvider {
    id: number;
    type: SsoProviderType;
    name: string;
    is_enabled: boolean;
    jit_enabled: boolean;
    validated_at: string | null;
    config: Record<string, string | number | string[] | null>;
    idp_certificate_configured?: boolean;
    sp_certificate_configured?: boolean;
    sp_private_key_configured?: boolean;
    bind_password_configured?: boolean;
}

export interface SsoSettings {
    saml: SsoProvider | null;
    ldap: SsoProvider | null;
}

export interface ServerProps {
    serverSettings: ServerSettings;
    license: LicenseInfo;
    about: AboutInfo;
    storage: StorageInfo;
    sso: SsoSettings | null;
    ssoWorkspaces: Array<{ id: Id; name: string }>;
}

export type ServerTab = 'general' | 'license' | 'branding' | 'sso';
