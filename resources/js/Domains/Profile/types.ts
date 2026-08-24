export interface ApiKey {
    id: number;
    name: string;
    key_preview: string | null;
    last_used_at: string | null;
    created_at: string;
}

export interface LinkedSsoIdentity {
    name: string;
    email: string | null;
}

export interface ProfileSso {
    enabled: boolean;
    providers: {
        saml: boolean;
        ldap: boolean;
    };
    linked: {
        saml?: LinkedSsoIdentity;
        ldap?: LinkedSsoIdentity;
    };
}
