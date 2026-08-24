import type { DNSRecord } from '@/Domains/Mailbox/types';
import { resolveDnsRecordValue } from '@/Domains/Mailbox/Pages/Domains/utils';
import * as S from './styled';

interface Props {
    dnsRecords: DNSRecord[];
    publicIp: string;
}

export default function DnsRecordsTable({ dnsRecords, publicIp }: Props) {
    return (
        <S.TableWrap>
            <S.Table>
                <thead>
                    <tr>
                        <S.HeaderCell>Type</S.HeaderCell>
                        <S.HeaderCell>Name</S.HeaderCell>
                        <S.HeaderCell>Value</S.HeaderCell>
                        <S.HeaderCell>Priority</S.HeaderCell>
                        <S.HeaderCell>TTL</S.HeaderCell>
                    </tr>
                </thead>
                <tbody>
                    {dnsRecords.map((record, index) => (
                        <tr key={index}>
                            <S.Cell>
                                <S.TypeBadge>{record.type}</S.TypeBadge>
                            </S.Cell>
                            <S.ValueCell>{record.name}</S.ValueCell>
                            <S.ValueCell $mono>
                                {resolveDnsRecordValue(record, publicIp)}
                            </S.ValueCell>
                            <S.ValueCell>{record.priority ?? '-'}</S.ValueCell>
                            <S.ValueCell>{record.ttl}</S.ValueCell>
                        </tr>
                    ))}
                </tbody>
            </S.Table>
        </S.TableWrap>
    );
}
