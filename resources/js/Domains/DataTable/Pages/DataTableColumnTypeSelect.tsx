import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import { COLUMN_TYPE_OPTIONS } from '../columnTypes';
import type { DataTableColumnType } from '../types';
import * as S from './styled';

interface Props {
    value: DataTableColumnType;
    onChange: (value: DataTableColumnType) => void;
}

export default function DataTableColumnTypeSelect({ value, onChange }: Props) {
    return (
        <S.TypeSelectRoot>
            <CustomSelect<DataTableColumnType>
                value={value}
                options={COLUMN_TYPE_OPTIONS}
                compact
                compactHeight={31}
                dropdownMinWidth={180}
                searchThreshold={8}
                showOptionValue={false}
                ariaLabel="Column type"
                onChange={onChange}
            />
        </S.TypeSelectRoot>
    );
}
