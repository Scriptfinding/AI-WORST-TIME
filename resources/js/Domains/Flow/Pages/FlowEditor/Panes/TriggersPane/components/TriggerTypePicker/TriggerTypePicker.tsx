import { Icon } from '@/Shared/UI/Icon/Icon';
import Modal from '@/Shared/UI/Modal/Modal';
import type { TriggerType } from '@/Domains/Flow/Pages/FlowEditor/Panes/TriggersPane/types';
import * as S from './styled';

interface TriggerTypePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: TriggerType) => void;
}

const TRIGGER_TYPES = [
    {
        type: 'webhook' as const,
        icon: 'lucide:webhook',
        label: 'Webhook',
        description: 'Triggered via HTTP endpoint',
    },
    {
        type: 'cron' as const,
        icon: 'lucide:clock',
        label: 'Schedule',
        description: 'Runs on a cron schedule',
    },
];

export default function TriggerTypePicker({ isOpen, onClose, onSelect }: TriggerTypePickerProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Choose trigger type">
            <S.Options>
                {TRIGGER_TYPES.map(option => (
                    <S.Card key={option.type} onClick={() => onSelect(option.type)}>
                        <Icon icon={option.icon} width={22} />
                        <S.Label>{option.label}</S.Label>
                        <S.Description>{option.description}</S.Description>
                    </S.Card>
                ))}
            </S.Options>
        </Modal>
    );
}
