import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

export interface StatItem {
    label: string;
    value: React.ReactNode;
    icon: string;
    color: string;
    progress?: number;
}

const RING_RADIUS = 13;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function StatsGrid({ items }: { items: StatItem[] }) {
    return (
        <S.Grid>
            {items.map(item => {
                const progress = item.progress != null ? Math.min(100, Math.max(0, item.progress)) : null;

                return (
                    <S.StatCard key={item.label}>
                        <S.StatIcon $fg={item.color} $round={progress != null}>
                            <Icon icon={item.icon} width={15} height={15} />
                            {progress != null && (
                                <S.StatProgressRing viewBox="0 0 30 30" aria-hidden>
                                    <circle className="track" cx="15" cy="15" r={RING_RADIUS} />
                                    <circle
                                        className="progress"
                                        cx="15"
                                        cy="15"
                                        r={RING_RADIUS}
                                        strokeDasharray={RING_CIRCUMFERENCE}
                                        strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress / 100)}
                                    />
                                </S.StatProgressRing>
                            )}
                        </S.StatIcon>
                        <S.StatText>
                            <S.StatLabel>{item.label}</S.StatLabel>
                            <S.StatValue>{item.value}</S.StatValue>
                        </S.StatText>
                    </S.StatCard>
                );
            })}
        </S.Grid>
    );
}
