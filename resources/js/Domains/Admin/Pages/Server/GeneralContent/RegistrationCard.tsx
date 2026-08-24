import { Icon } from '@/Shared/UI/Icon/Icon';
import { ToggleGroup, ToggleRow, ToggleInfo, ToggleLabel } from './RegistrationCard.styled';
import Switch from '@/Shared/UI/Switch/Switch';
import * as SharedStyles from '../shared.styled';

const S = {
    ...SharedStyles,
    ToggleGroup,
    ToggleInfo,
    ToggleLabel,
    ToggleRow,
};

interface Props {
    invitationRequestsEnabled: boolean;
    magicLinkEnabled: boolean;
    magicLinkDisabled: boolean;
    onToggleInvitationRequests: () => void;
    onToggleMagicLink: (enabled: boolean) => void;
}

export default function RegistrationCard({
    invitationRequestsEnabled,
    magicLinkEnabled,
    magicLinkDisabled,
    onToggleInvitationRequests,
    onToggleMagicLink,
}: Props) {
    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:user-plus" width={15} height={15} />
                Authentication
            </S.CardTitle>
            <S.ToggleGroup>
                <S.ToggleRow>
                    <S.ToggleInfo>
                        <S.ToggleLabel>Invitation requests</S.ToggleLabel>
                        <S.ToggleDescription>
                            {invitationRequestsEnabled
                                ? 'Anyone can request access. An administrator must approve the account and assign its workspaces.'
                                : 'Only direct workspace invitations can be used to request an account.'}
                        </S.ToggleDescription>
                    </S.ToggleInfo>
                    <Switch
                        checked={invitationRequestsEnabled}
                        onChange={onToggleInvitationRequests}
                        ariaLabel="Enable invitation requests"
                    />
                </S.ToggleRow>
                <S.ToggleRow>
                    <S.ToggleInfo>
                        <S.ToggleLabel>Require magic link</S.ToggleLabel>
                        <S.ToggleDescription>
                            {magicLinkEnabled
                                ? 'Users sign in and accept invitations with a one-time email code or secure link.'
                                : 'Users sign in and accept invitations with their password.'}
                        </S.ToggleDescription>
                    </S.ToggleInfo>
                    <Switch
                        checked={magicLinkEnabled}
                        onChange={onToggleMagicLink}
                        ariaLabel="Require magic link authentication"
                        disabled={magicLinkDisabled}
                    />
                </S.ToggleRow>
            </S.ToggleGroup>
        </S.Card>
    );
}
