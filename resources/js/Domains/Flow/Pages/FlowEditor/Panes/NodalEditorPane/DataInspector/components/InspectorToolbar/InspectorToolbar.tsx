import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

export type InspectorTab = 'json' | 'schema';

interface InspectorToolbarProps {
    title: string;
    tab: InspectorTab;
    hasValue: boolean;
    onTabChange: (tab: InspectorTab) => void;
    onCopy: () => void;
}

const TABS: InspectorTab[] = ['json', 'schema'];

export default function InspectorToolbar({
    title,
    tab,
    hasValue,
    onTabChange,
    onCopy,
}: InspectorToolbarProps) {
    return (
        <S.Header>
            <strong>{title}</strong>
            <S.Actions>
                {hasValue && (
                    <S.ActionButton type="button" title="Copy JSON" aria-label="Copy JSON" onClick={onCopy}>
                        <Icon icon="lucide:copy" width={11} height={11} />
                    </S.ActionButton>
                )}
                <S.Tabs>
                    {TABS.map(item => (
                        <S.Tab key={item} type="button" $active={tab === item} onClick={() => onTabChange(item)}>
                            {item}
                        </S.Tab>
                    ))}
                </S.Tabs>
            </S.Actions>
        </S.Header>
    );
}
