import { Icon } from '@/Shared/UI/Icon/Icon';
import type { AboutInfo } from '@/Domains/Admin/Pages/Server/types';
import * as S from '../shared.styled';

interface Props {
    about: AboutInfo;
}

export default function AboutCard({ about }: Props) {
    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:info" width={15} height={15} />
                About
            </S.CardTitle>
            <S.AboutRow>
                <S.AboutLabel>Name</S.AboutLabel>
                <S.AboutValue>{about.name}</S.AboutValue>
            </S.AboutRow>
            <S.AboutRow>
                <S.AboutLabel>Version</S.AboutLabel>
                <S.AboutValue>{about.version}</S.AboutValue>
            </S.AboutRow>
        </S.Card>
    );
}
