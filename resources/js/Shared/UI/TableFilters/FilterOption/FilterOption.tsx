import { Icon } from '@/Shared/UI/Icon/Icon';
import type { TableFilterOption } from '../types';
import * as S from './styled';

interface Props {
    active: boolean;
    onSelect: (value: string) => void;
    option: TableFilterOption;
}

export default function FilterOption({ active, onSelect, option }: Props) {
    return (
        <S.DropdownItem
            type="button"
            $active={active}
            onClick={() => onSelect(option.value)}
        >
            <Icon icon={option.icon} width={14} />
            {option.label}
        </S.DropdownItem>
    );
}
