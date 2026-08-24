import { Icon } from '@/Shared/UI/Icon/Icon';
import Modal from '@/Shared/UI/Modal/Modal';
import type { SnippetType } from '@/Domains/Snippet/types';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: SnippetType) => void;
}

const OPTIONS = [
    {
        type: 'nodal' as const,
        label: 'Nodal Snippet',
        description: 'Build the function visually with nodes and expressions.',
        icon: 'lucide:workflow',
    },
    {
        type: 'code' as const,
        label: 'Code Snippet',
        description: 'Write the function body directly in JavaScript.',
        icon: 'lucide:code-2',
    },
];

export default function SnippetTypePicker({ isOpen, onClose, onSelect }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Choose snippet type" width="520px">
            <S.Options>
                {OPTIONS.map(option => (
                    <S.Card key={option.type} type="button" onClick={() => onSelect(option.type)}>
                        <Icon icon={option.icon} width={24} />
                        <S.Label>{option.label}</S.Label>
                        <S.Description>{option.description}</S.Description>
                    </S.Card>
                ))}
            </S.Options>
        </Modal>
    );
}
