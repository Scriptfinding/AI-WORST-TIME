import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Integration } from '@/Domains/Integration/types';
import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import { useClickOutside } from '@/Shared/Hooks/useClickOutside';
import * as S from './styled.pp';

interface Props {
    integrations: Integration[];
    selectedIntegration?: Integration;
    onSelect: (id: Id) => void;
}

export default function ProviderField({ integrations, selectedIntegration, onSelect }: Props) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const providerConfig = selectedIntegration ? getProviderConfig(selectedIntegration.provider) : undefined;

    useClickOutside({ refs: [wrapperRef], onOutside: () => setOpen(false) });

    const handleSelect = (id: Id) => {
        onSelect(id);
        setOpen(false);
    };

    return (
        <S.FieldGroup>
            <S.FieldLabel>Repository Integration</S.FieldLabel>
            <S.SelectWrapper ref={wrapperRef}>
                <S.SelectTrigger $hasValue={!!selectedIntegration} onClick={() => setOpen(value => !value)} type="button">
                    <S.TriggerContent>
                        {selectedIntegration ? (
                            <>
                                <Icon icon={providerConfig?.icon ?? 'lucide:git-branch'} width={14} style={{ color: providerConfig?.color }} />
                                {selectedIntegration.name}
                            </>
                        ) : 'Select an integration...'}
                    </S.TriggerContent>
                    <Icon icon="lucide:chevron-down" width={14} />
                </S.SelectTrigger>
                {open && (
                    <S.SelectDropdown>
                        {integrations.map(integration => {
                            const config = getProviderConfig(integration.provider);
                            return (
                                <S.SelectItem
                                    key={integration.id}
                                    $active={integration.id === selectedIntegration?.id}
                                    onClick={() => handleSelect(integration.id)}
                                    type="button"
                                >
                                    <Icon icon={config?.icon ?? 'lucide:git-branch'} width={14} style={{ color: config?.color }} />
                                    {integration.name}
                                </S.SelectItem>
                            );
                        })}
                    </S.SelectDropdown>
                )}
            </S.SelectWrapper>
        </S.FieldGroup>
    );
}
