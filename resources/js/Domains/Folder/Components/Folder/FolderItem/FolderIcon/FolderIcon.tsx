import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    shared: boolean;
    team: boolean;
}

export default function FolderIcon({ shared, team }: Props) {
    return (
        <S.FolderIcon $team={team} $shared={!team && shared}>
            <Icon icon="lucide:folder" />
            {team ? (
                <S.TeamBadge>
                    <Icon icon="lucide:users" />
                </S.TeamBadge>
            ) : shared ? (
                <S.SharedBadge>
                    <Icon icon="lucide:building-2" />
                </S.SharedBadge>
            ) : null}
        </S.FolderIcon>
    );
}
