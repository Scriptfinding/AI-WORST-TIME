import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import { useAuth } from '@/App/Hooks/usePageProps';
import type { ApiKey, ProfileSso } from '@/Domains/Profile/types';
import { SettingsTabs, SettingsTab, SettingsTabsScroller } from '@/Shared/UI/SettingsTabs/styled';
import SsoIdentitySection from '@proprietary/Domains/Profile/SsoIdentitySection.pp';
import PersonalInfoSection from './Sections/PersonalInfoSection/PersonalInfoSection';
import SecuritySection from './Sections/SecuritySection';
import ApiKeysSection from './Sections/ApiKeysSection/ApiKeysSection';
import OnboardingSection from './Sections/OnboardingSection/OnboardingSection';
import * as S from './styled';
import { useProfileTab } from './useProfileTab';

interface Props {
    apiKeys: ApiKey[];
    newApiKey: string | null;
    twoFactorEnabled: boolean;
    sso: ProfileSso;
}

export default function Profile({ apiKeys, newApiKey, twoFactorEnabled, sso }: Props) {
    const { user } = useAuth();
    const { activeTab, changeTab } = useProfileTab();

    if (!user) return null;

    return (
        <AppLayout title="Profile">
            <SettingsTabsScroller>
                <SettingsTabs>
                    <SettingsTab $active={activeTab === 'general'} onClick={() => changeTab('general')}>
                        <Icon icon="lucide:user-round" width={14} height={14} />
                        General
                    </SettingsTab>
                    <SettingsTab $active={activeTab === 'security'} onClick={() => changeTab('security')}>
                        <Icon icon="lucide:shield" width={14} height={14} />
                        Security
                    </SettingsTab>
                    <SettingsTab $active={activeTab === 'api'} onClick={() => changeTab('api')}>
                        <Icon icon="lucide:key-round" width={14} height={14} />
                        API
                    </SettingsTab>
                </SettingsTabs>
            </SettingsTabsScroller>

            {activeTab === 'general' && (
                <S.Container>
                    <PersonalInfoSection user={user} />
                    <OnboardingSection />
                </S.Container>
            )}

            {activeTab === 'security' && (
                <S.SecurityContainer>
                    <SecuritySection twoFactorEnabled={twoFactorEnabled} />
                    <SsoIdentitySection sso={sso} />
                </S.SecurityContainer>
            )}

            {activeTab === 'api' && (
                <S.ApiTab>
                    <ApiKeysSection apiKeys={apiKeys} newApiKey={newApiKey} />
                </S.ApiTab>
            )}
        </AppLayout>
    );
}
