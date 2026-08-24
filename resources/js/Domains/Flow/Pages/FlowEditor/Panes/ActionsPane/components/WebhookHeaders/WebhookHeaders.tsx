import { Icon } from '@/Shared/UI/Icon/Icon';
import type { WebhookHeader } from '@/Domains/Flow/types';
import * as S from './styled';

interface WebhookHeadersProps {
    headers: WebhookHeader[];
    onChange: (headers: WebhookHeader[]) => void;
}

export default function WebhookHeaders({ headers, onChange }: WebhookHeadersProps) {
    const addHeader = () => onChange([...headers, { key: '', value: '' }]);
    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        onChange(headers.map((header, currentIndex) => (
            currentIndex === index ? { ...header, [field]: value } : header
        )));
    };
    const removeHeader = (index: number) => {
        onChange(headers.filter((_, currentIndex) => currentIndex !== index));
    };

    return (
        <div>
            <S.Label>Custom Headers</S.Label>
            {headers.map((header, index) => (
                <S.HeaderRow key={index}>
                    <S.HeaderInput
                        placeholder="Header name"
                        value={header.key}
                        onChange={event => updateHeader(index, 'key', event.target.value)}
                    />
                    <S.HeaderInput
                        placeholder="Value"
                        value={header.value}
                        onChange={event => updateHeader(index, 'value', event.target.value)}
                    />
                    <S.RemoveButton type="button" onClick={() => removeHeader(index)}>
                        <Icon icon="lucide:x" width={12} />
                    </S.RemoveButton>
                </S.HeaderRow>
            ))}
            <S.AddButton type="button" onClick={addHeader}>
                <Icon icon="lucide:plus" width={12} /> Add header
            </S.AddButton>
        </div>
    );
}
