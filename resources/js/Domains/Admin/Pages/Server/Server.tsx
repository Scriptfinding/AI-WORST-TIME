import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import type { PageProps } from '@/App/types';
import { SettingsTabsScroller, SettingsTabs, SettingsTab } from '@/Shared/UI/SettingsTabs/styled';
import BrandingSection from '@proprietary/Domains/Admin/Pages/Server/BrandingSection.pp';
import SsoSection from '@proprietary/Domains/Admin/Pages/Server/SsoSection.pp';
import GeneralContent from './GeneralContent/GeneralContent';
import LicenseContent from '@proprietary/Domains/Admin/Pages/Server/LicenseContent/LicenseContent.pp';
import type { ServerProps, ServerTab } from './types';
import { getInitialTab } from './utils';
import * as S from './styled';

export default function Server({ serverSettings, license, about, storage, sso, ssoWorkspaces }: ServerProps) {
    const { auth, flash, settings, branding } = usePage<{ props: PageProps }>().props as unknown as PageProps;
    const [activeTab, setActiveTab] = useState<ServerTab>(() =>
        typeof window === 'undefined'
            ? 'general'
            : getInitialTab(window.location.search, settings.whitelabel_enabled, settings.sso_enabled),
    );

    const handleTabChange = (tab: ServerTab) => {
        setActiveTab(tab);

        const url = new URL(window.location.href);
        if (tab === 'general') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tab);
        }
        window.history.replaceState(null, '', url.toString());
    };

    return (
        <AppLayout title="Server">
            <SettingsTabsScroller>
                <SettingsTabs>
                    <SettingsTab $active={activeTab === 'general'} onClick={() => handleTabChange('general')}>
                        <Icon icon="lucide:settings" width={14} height={14} />
                        General
                    </SettingsTab>
                    <SettingsTab $active={activeTab === 'license'} onClick={() => handleTabChange('license')}>
                        <Icon icon="lucide:key-round" width={14} height={14} />
                        License
                    </SettingsTab>
                    {settings.whitelabel_enabled && (
                        <SettingsTab $active={activeTab === 'branding'} onClick={() => handleTabChange('branding')}>
                            <Icon icon="lucide:palette" width={14} height={14} />
                            Branding
                        </SettingsTab>
                    )}
                    {settings.sso_enabled && (
                        <SettingsTab $active={activeTab === 'sso'} onClick={() => handleTabChange('sso')}>
                            <Icon icon="lucide:shield-check" width={14} height={14} />
                            SSO
                        </SettingsTab>
                    )}
                </SettingsTabs>
            </SettingsTabsScroller>

            {(flash?.success || flash?.error) && (
                <S.FlashStack>
                    {flash?.success && <S.Flash $variant="success">{flash.success}</S.Flash>}
                    {flash?.error && <S.Flash $variant="error">{flash.error}</S.Flash>}
                </S.FlashStack>
            )}

            <GeneralContent
                active={activeTab === 'general'}
                serverSettings={serverSettings}
                about={about}
                storage={storage}
                userEmail={auth.user?.email ?? ''}
            />

            <LicenseContent active={activeTab === 'license'} license={license} />

            {settings.whitelabel_enabled && activeTab === 'branding' && (
                <S.TabContent>
                    <BrandingSection branding={branding} />
                </S.TabContent>
            )}

            {settings.sso_enabled && activeTab === 'sso' && sso && (
                <SsoSection sso={sso} workspaces={ssoWorkspaces} />
            )}

        </AppLayout>
    );
}
