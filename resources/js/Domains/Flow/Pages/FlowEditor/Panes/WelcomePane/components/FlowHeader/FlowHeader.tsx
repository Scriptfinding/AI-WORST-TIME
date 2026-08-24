import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { useFocusWhen } from '@/Shared/Hooks/useFocusWhen';
import { useSyncedState } from '@/Shared/Hooks/useSyncedState';
import type { Flow } from '@/Domains/Flow/types';
import { formatDate } from '@/Shared/Utils/formatDate';
import type { FlowStats } from '@/Domains/Flow/Pages/FlowEditor/types';
import { formatDuration } from '@/Domains/Flow/Pages/FlowEditor/Panes/WelcomePane/utils';
import * as S from './styled';

interface FlowHeaderProps {
    flow: Flow;
    stats: FlowStats;
    canEdit: boolean;
    onSave: (data: Record<string, string | null>) => void;
    onSwitchToSettings: (scrollTo?: string) => void;
}

export default function FlowHeader({
    flow,
    stats,
    canEdit,
    onSave,
    onSwitchToSettings,
}: FlowHeaderProps) {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useSyncedState(flow.name);
    const titleRef = useRef<HTMLInputElement>(null);

    useFocusWhen({ ref: titleRef, when: editingTitle });

    const commitTitle = () => {
        setEditingTitle(false);
        const trimmed = titleDraft.trim();
        if (trimmed && trimmed !== flow.name) {
            onSave({ name: trimmed });
        } else {
            setTitleDraft(flow.name);
        }
    };

    const operatorDurationMs = (flow.operator_seconds ?? 0) * (stats.success ?? 0) * 1000;
    const statItems: { label: string; value: number; color: string; format?: (value: number) => string }[] = [
        { label: 'Total', value: stats.total, color: '#6366f1' },
        { label: 'Success', value: stats.success, color: '#22c55e' },
        { label: 'Failed', value: stats.failed, color: '#ef4444' },
        { label: 'Cancelled', value: stats.cancelled, color: '#d97706' },
        { label: 'Runtime', value: stats.total_duration_ms, color: '#eab308', format: formatDuration },
        { label: 'Saved', value: operatorDurationMs, color: '#a855f7', format: formatDuration },
    ];

    return (
        <>
            <S.IconRow>
                <S.IconWrap
                    $canEdit={canEdit}
                    onClick={() => canEdit && onSwitchToSettings('icon')}
                    title={canEdit ? 'Change icon' : undefined}
                >
                    <FlowIcon flow={flow} size={56} radius="lg" />
                </S.IconWrap>
            </S.IconRow>

            <S.HeaderRow>
                <S.HeaderBlock>
                    <S.TitleRow>
                        {editingTitle ? (
                            <S.InlineInput
                                ref={titleRef}
                                value={titleDraft}
                                onChange={event => setTitleDraft(event.target.value)}
                                onBlur={commitTitle}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') commitTitle();
                                    if (event.key === 'Escape') {
                                        setEditingTitle(false);
                                        setTitleDraft(flow.name);
                                    }
                                }}
                                maxLength={128}
                            />
                        ) : (
                            <>
                                <S.Title>{flow.name}</S.Title>
                                {canEdit && (
                                    <S.EditIcon onClick={() => setEditingTitle(true)} title="Edit name">
                                        <Icon icon="lucide:pencil" />
                                    </S.EditIcon>
                                )}
                            </>
                        )}
                    </S.TitleRow>
                    <S.SubLine>
                        <S.SubLineRow>
                            {flow.owner && <span>by {flow.owner.name}</span>}
                            {flow.owner && <S.Dot />}
                            <span>Created {formatDate(flow.created_at)}</span>
                        </S.SubLineRow>
                    </S.SubLine>
                </S.HeaderBlock>

                <S.StatsGrid>
                    {statItems.map(({ label, value, color, format }) => (
                        <S.StatCard key={label} $accent={color}>
                            <S.StatLabel>{label}</S.StatLabel>
                            <S.StatNumber $accent={color}>{format ? format(value) : value}</S.StatNumber>
                        </S.StatCard>
                    ))}
                </S.StatsGrid>
            </S.HeaderRow>
        </>
    );
}
