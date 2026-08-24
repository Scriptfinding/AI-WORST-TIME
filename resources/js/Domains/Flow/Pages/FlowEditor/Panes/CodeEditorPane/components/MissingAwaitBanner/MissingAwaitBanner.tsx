import { Icon } from '@/Shared/UI/Icon/Icon';
import type { MissingAwaitCall } from '@/Domains/Flow/Pages/FlowEditor/utils/missingAwaits';
import * as S from './styled';

interface MissingAwaitBannerProps {
    calls: MissingAwaitCall[];
    onFixAll: () => void;
}

export function MissingAwaitBanner({ calls, onFixAll }: MissingAwaitBannerProps) {
    const uniqueNames = [...new Set(calls.map(call => call.name))];
    const helperSummary = uniqueNames.length <= 3
        ? uniqueNames.join(', ')
        : `${uniqueNames.slice(0, 3).join(', ')} and ${uniqueNames.length - 3} more`;
    const label = calls.length === 1
        ? '1 async helper call is missing await.'
        : `${calls.length} async helper calls are missing await.`;

    return (
        <S.Banner role="status">
            <S.Content>
                <S.IconWrap>
                    <Icon icon="lucide:lightbulb" width={15} />
                </S.IconWrap>
                <S.Text>
                    <S.Title>{label}</S.Title>
                    <S.Helpers>{helperSummary}</S.Helpers>
                </S.Text>
            </S.Content>
            <S.FixButton type="button" onClick={onFixAll}>
                <Icon icon="lucide:wand-sparkles" width={13} />
                Fix all
            </S.FixButton>
        </S.Banner>
    );
}
