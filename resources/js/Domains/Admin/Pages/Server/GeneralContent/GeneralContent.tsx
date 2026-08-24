import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import { DocsBanner, DocsBannerIcon, DocsBannerText, DocsBannerTitle, DocsBannerDescription } from './styled';
import MagicLinkChallenge from '@/Domains/Admin/Pages/Server/MagicLinkChallenge/MagicLinkChallenge';
import type { AboutInfo, ServerSettings, StorageInfo } from '@/Domains/Admin/Pages/Server/types';
import AboutCard from './AboutCard';
import RegistrationCard from './RegistrationCard';
import StorageCard from './StorageCard';
import * as SharedStyles from '../shared.styled';
import { useMagicLinkChallenge } from './useMagicLinkChallenge';

const S = {
    ...SharedStyles,
    DocsBanner,
    DocsBannerDescription,
    DocsBannerIcon,
    DocsBannerText,
    DocsBannerTitle,
};

interface Props {
    active: boolean;
    serverSettings: ServerSettings;
    about: AboutInfo;
    storage: StorageInfo;
    userEmail: string;
}

export default function GeneralContent({ active, serverSettings, about, storage, userEmail }: Props) {
    const [invitationRequestsEnabled, setInvitationRequestsEnabled] = useState(
        serverSettings.invitation_requests_enabled,
    );
    const magicLink = useMagicLinkChallenge(serverSettings.magic_link_enabled, userEmail);

    const handleToggleInvitationRequests = () => {
        const enabled = !invitationRequestsEnabled;
        setInvitationRequestsEnabled(enabled);
        router.put('/admin/server', { invitation_requests_enabled: enabled }, { preserveState: true });
    };

    return (
        <>
            {active && <S.Page>
                <S.Column>
                    <RegistrationCard
                        invitationRequestsEnabled={invitationRequestsEnabled}
                        magicLinkEnabled={magicLink.enabled}
                        magicLinkDisabled={magicLink.saving || magicLink.processing}
                        onToggleInvitationRequests={handleToggleInvitationRequests}
                        onToggleMagicLink={magicLink.toggle}
                    />
                    <StorageCard storage={storage} />
                </S.Column>

                <S.Column>
                    <AboutCard about={about} />
                    <S.DocsBanner href="https://docs.puppetflow.com" target="_blank" rel="noopener noreferrer">
                        <S.DocsBannerIcon>
                            <Icon icon="lucide:book-open" width={18} height={18} />
                        </S.DocsBannerIcon>
                        <S.DocsBannerText>
                            <S.DocsBannerTitle>Puppetflow Documentation</S.DocsBannerTitle>
                            <S.DocsBannerDescription>
                                Guides, API reference and more
                            </S.DocsBannerDescription>
                        </S.DocsBannerText>
                        <Icon icon="lucide:arrow-up-right" width={14} height={14} />
                    </S.DocsBanner>
                </S.Column>
            </S.Page>}

            <MagicLinkChallenge
                isOpen={magicLink.isOpen}
                challengeId={magicLink.challengeId}
                email={magicLink.email}
                otp={magicLink.otp}
                error={magicLink.error}
                processing={magicLink.processing}
                resendWait={magicLink.resendWait}
                onClose={magicLink.close}
                onRequest={() => { void magicLink.request(); }}
                onConfirm={() => { void magicLink.confirm(); }}
            />
        </>
    );
}
