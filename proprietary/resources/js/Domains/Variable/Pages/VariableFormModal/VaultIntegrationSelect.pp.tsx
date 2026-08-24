import type { Integration } from '@/Domains/Integration/types';
import SearchSelect from '@proprietary/Domains/Variable/Pages/VariableFormModal/SearchSelect.pp';
import type { VaultDataPatch } from './vaultFieldTypes.pp';
import * as S from './VaultIntegrationSelect.styled.pp';

interface VaultIntegrationSelectProps {
    connections: Integration[];
    integrationId: Id;
    onChange: (patch: VaultDataPatch) => void;
}

export default function VaultIntegrationSelect({
    connections,
    integrationId,
    onChange,
}: VaultIntegrationSelectProps) {
    return (
        <S.Section>
            <SearchSelect
                label="Connection"
                value={integrationId ? String(integrationId) : ''}
                onChange={value => onChange({
                    integrationId: value,
                    vaultId: '',
                    vaultName: '',
                    itemId: '',
                    itemName: '',
                    fieldLabel: '',
                    fieldType: '',
                })}
                options={connections.map(connection => ({
                    value: connection.id,
                    label: connection.name,
                }))}
                placeholder="Select a connection"
            />
        </S.Section>
    );
}
