import DateField from './DateField/DateField';
import * as S from './styled';

interface Props {
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
}

export default function DateFilters({
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
}: Props) {
    return (
        <S.Row>
            <DateField label="From" value={dateFrom} onChange={onDateFromChange} />
            <DateField label="To" value={dateTo} onChange={onDateToChange} />
        </S.Row>
    );
}
