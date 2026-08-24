import DeleteLicenseConfirmation from '@proprietary/Domains/Admin/Pages/Server/DeleteLicenseConfirmation/DeleteLicenseConfirmation.pp';
import type { LicenseInfo } from '@/Domains/Admin/Pages/Server/types';
import ActivationFileSection from './ActivationFileSection.pp';
import CycleUsageSection from './CycleUsageSection.pp';
import EntitlementsSection from './EntitlementsSection.pp';
import OverviewSection from './OverviewSection.pp';
import StorageUsageSection from './StorageUsageSection.pp';
import * as S from '@/Domains/Admin/Pages/Server/shared.styled';
import { useLicenseActions } from './useLicenseActions.pp';

interface Props {
    active: boolean;
    license: LicenseInfo;
}

export default function LicenseContent({ active, license }: Props) {
    const actions = useLicenseActions();

    return (
        <>
            {active && (
                <S.Page>
                    <S.Column>
                        <OverviewSection license={license} pinging={actions.pinging} onPing={actions.ping} />
                        {!license.managed_license && (
                            <ActivationFileSection license={license} actions={actions} />
                        )}
                    </S.Column>

                    <S.Column>
                        <CycleUsageSection cycle={license.cycle} />
                        <StorageUsageSection storage={license.storage} />
                    </S.Column>

                    <S.FullWidth>
                        <EntitlementsSection featureFlags={license.feature_flags} />
                    </S.FullWidth>
                </S.Page>
            )}

            {!license.managed_license && (
                <DeleteLicenseConfirmation
                    isOpen={actions.deleteModalOpen}
                    onClose={actions.closeDeleteModal}
                />
            )}
        </>
    );
}
