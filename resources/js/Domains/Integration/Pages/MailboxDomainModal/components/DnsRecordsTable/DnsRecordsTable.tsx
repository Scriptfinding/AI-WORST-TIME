import type { DNSRecord } from '@/Domains/Mailbox/types';
import * as S from './styled';

interface Props {
    records: DNSRecord[];
    publicIp: string;
}

export default function DnsRecordsTable({ records, publicIp }: Props) {
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
                    {records.map((record, index) => (
                        <tr key={index}>
                            <S.Cell><S.Badge>{record.type}</S.Badge></S.Cell>
                            <S.Cell>{record.name}</S.Cell>
                            <S.Cell $mono>{record.value === 'X.X.X.X' ? publicIp : record.value}</S.Cell>
                            <S.Cell>{record.priority ?? '-'}</S.Cell>
                            <S.Cell>{record.ttl}</S.Cell>
                        </tr>
                    ))}
                </tbody>
            </S.Table>
        </S.TableWrap>
    );
}
