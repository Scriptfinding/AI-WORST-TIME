import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

export const CopyShortcut = () => <kbd><span>⌘</span><b>C</b></kbd>;
export const DuplicateShortcut = () => <kbd><b>D</b></kbd>;
export const DeactivateShortcut = () => <kbd><b>M</b></kbd>;
export const DeleteShortcut = () => <kbd>Del / <b>X</b></kbd>;
export const PasteShortcut = () => <kbd><span>⌘</span><b>V</b></kbd>;
export const AddNodeShortcut = () => (
    <S.CompactKeyCombo>
        <S.Key>A</S.Key>
        <S.Separator>/</S.Separator>
        <S.Key>N</S.Key>
    </S.CompactKeyCombo>
);
export const SelectAllShortcut = () => (
    <S.KeyCombo>
        <S.Modifier>⌘</S.Modifier>
        <S.Key>A</S.Key>
    </S.KeyCombo>
);

export function EditNodeShortcut() {
    return (
        <S.Group>
            <S.MouseShortcut aria-label="Double left click or E">
                <Icon icon="lucide:mouse" width={13} height={13} />
                <S.MouseLeftClickDot />
                <b>x2</b>&nbsp;/&nbsp;<b className="shortcut-key">E</b>
            </S.MouseShortcut>
            <kbd>Return</kbd>
        </S.Group>
    );
}
