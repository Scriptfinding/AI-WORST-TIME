import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface CoverSectionProps {
    color?: string | null;
    canEdit: boolean;
    editorIcon: string;
    editorLabel: string;
    onEditCover: () => void;
    onSwitchToCode: () => void;
}

export default function CoverSection({
    color,
    canEdit,
    editorIcon,
    editorLabel,
    onEditCover,
    onSwitchToCode,
}: CoverSectionProps) {
    return (
        <S.CoverZone>
            <S.Cover $color={color}>
                <S.CoverActions>
                    {canEdit && (
                        <S.CoverButton onClick={onEditCover} title="Change cover color">
                            <Icon icon="lucide:palette" />
                        </S.CoverButton>
                    )}
                </S.CoverActions>
            </S.Cover>
            <S.EditCodeBtn onClick={onSwitchToCode}>
                <Icon icon={editorIcon} />
                {editorLabel}
            </S.EditCodeBtn>
        </S.CoverZone>
    );
}
