import { Icon } from '@/Shared/UI/Icon/Icon';
import Input, { Select } from '@/Shared/UI/Input/Input';
import { CRON_PRESETS } from '@/Domains/Flow/Pages/FlowEditor/Panes/TriggersPane/utils';
import * as S from './CronFields.styled';

interface CronFieldsProps {
    preset: string;
    expression: string;
    timezone: string;
    userTime: string;
    onPresetChange: (preset: string) => void;
    onExpressionChange: (expression: string) => void;
}

export default function CronFields({
    preset,
    expression,
    timezone,
    userTime,
    onPresetChange,
    onExpressionChange,
}: CronFieldsProps) {
    return (
        <>
            <Select
                label="Schedule"
                value={preset}
                onChange={event => onPresetChange(event.target.value)}
                options={CRON_PRESETS}
            />
            {preset === 'custom' && (
                <Input
                    label="Cron expression"
                    value={expression}
                    onChange={event => onExpressionChange(event.target.value)}
                    placeholder="* * * * *"
                />
            )}
            <S.ClockHint>
                <Icon icon="lucide:clock" width={10} />
                Your time ({timezone}): {userTime}
            </S.ClockHint>
        </>
    );
}
