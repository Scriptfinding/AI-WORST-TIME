import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { PageProps } from '@/App/types';
import Switch from '@/Shared/UI/Switch/Switch';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Workspace } from '@/Domains/Workspace/types';
import MessageContent from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/MessageContent/MessageContent';
import * as S from './SecuritySection.styled';

interface Props {
    workspace: Workspace;
    readOnly?: boolean;
}

export default function SecuritySection({ workspace, readOnly }: Props) {
    const { confirm, ConfirmModal } = useConfirm();
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const featureEnabled = settings.two_factor_enforcement_enabled;

    const handleToggle2FA = async (value: boolean) => {
        if (readOnly || !featureEnabled) return;

        if (value) {
            const ok = await confirm({
                title: 'Require 2FA for all members?',
                message: 'Members who have not enabled two-factor authentication will be redirected to set it up before they can continue using this workspace.',
                confirmLabel: 'Require 2FA',
                variant: 'danger',
            });

            if (!ok) return;
        }

        router.put('/workspace', { require_two_factor: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <S.Column>
                <Switch
                    id="require_two_factor"
                    checked={featureEnabled && (workspace.require_two_factor ?? false)}
                    onChange={handleToggle2FA}
                    label="Require two-factor authentication for all members"
                    disabled={readOnly || !featureEnabled}
                />
                {!featureEnabled && settings.promote_disabled_features && (
                    <S.FeatureHint>
                        <MessageContent message={settings.disabled_feature_message} />
                    </S.FeatureHint>
                )}
            </S.Column>
            <ConfirmModal />
        </>
    );
}
