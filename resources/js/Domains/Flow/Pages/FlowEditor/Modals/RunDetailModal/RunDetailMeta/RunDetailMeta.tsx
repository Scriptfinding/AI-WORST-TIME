import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowRun } from '@/Domains/Flow/types';
import { getRunMeta, renderInlineMarkdown } from '@/Domains/Flow/Pages/FlowEditor/utils/runDisplay';
import * as S from './styled';

interface RunDetailMetaProps {
    run: FlowRun;
}

export default function RunDetailMeta({ run }: RunDetailMetaProps) {
    const meta = getRunMeta(run);

    if (!meta) {
        return null;
    }

    return (
        <S.HeaderMeta>
            <S.HeaderMetaLabel>
                <Icon icon="lucide:tag" width={11} height={11} />
                Meta
            </S.HeaderMetaLabel>
            <S.HeaderMetaEntries>
                {Object.entries(meta).map(([key, value]) => (
                    <S.HeaderMetaChip key={key}>
                        <S.HeaderMetaChipKey>{key}:</S.HeaderMetaChipKey>
                        {typeof value === 'object'
                            ? JSON.stringify(value)
                            : renderInlineMarkdown(String(value))}
                    </S.HeaderMetaChip>
                ))}
            </S.HeaderMetaEntries>
        </S.HeaderMeta>
    );
}
