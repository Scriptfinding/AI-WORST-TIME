import { usePage } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import AuthLayout from '@/App/Layout/AuthLayout/AuthLayout';
import type { PageProps } from '@/App/types';
import SetupView from './SetupView';
import SuccessView from './SuccessView';
import * as S from './styled';

interface Props {
    qrSvg: string;
    secret: string;
    forced: boolean;
    recoveryCodes: string[] | null;
}

export default function TwoFactorSetup({ qrSvg, secret, forced, recoveryCodes }: Props) {
    const { flash } = usePage<{ props: PageProps }>().props as unknown as PageProps;
    const isJustEnabled = flash.success === 'Two-factor authentication enabled.';

    const content = (
        <S.SetupCard>
            {forced && !isJustEnabled && (
                <S.ForcedBanner>
                    <Icon icon="lucide:shield-alert" width={18} height={18} style={{ flexShrink: 0 }} />
                    Your workspace requires two-factor authentication. Set it up to continue.
                </S.ForcedBanner>
            )}

            {isJustEnabled ? (
                <SuccessView recoveryCodes={recoveryCodes} />
            ) : (
                <SetupView qrSvg={qrSvg} secret={secret} />
            )}
        </S.SetupCard>
    );

    if (forced) {
        return (
            <AppLayout title="Set Up Two-Factor Authentication">
                {content}
            </AppLayout>
        );
    }

    return (
        <AuthLayout
            title="Set Up Two-Factor Authentication"
            subtitle="Protect your account with an authenticator app"
        >
            {content}
        </AuthLayout>
    );
}
