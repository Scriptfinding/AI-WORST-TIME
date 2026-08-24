import * as S from './styled.pp';

interface Props {
    loading: boolean;
    hasSourceOptions: boolean;
    hasOptions: boolean;
    hasSearch: boolean;
    loadingLabel: string;
    emptyLabel: string;
    noMatchLabel: string;
}

export default function SelectionStatus({
    loading,
    hasSourceOptions,
    hasOptions,
    hasSearch,
    loadingLabel,
    emptyLabel,
    noMatchLabel,
}: Props) {
    if (loading && !hasSourceOptions) {
        return <S.Status>{loadingLabel}</S.Status>;
    }

    if (!hasOptions) {
        return <S.Status>{hasSearch ? noMatchLabel : emptyLabel}</S.Status>;
    }

    return null;
}
