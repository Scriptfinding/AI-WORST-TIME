import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { InfoGrid, InfoItem, InfoLabel, InfoValue, Section, SectionTitle, SectionDesc, TabsBar, Tab, VerifyHeader } from './DomainShow.styled';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import Button from '@/Shared/UI/Button/Button';
import type { Integration } from '@/Domains/Integration/types';
import type { MailboxDomain, DNSRecord, DNSCheckResult } from '@/Domains/Mailbox/types';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { formatDate } from '@/Shared/Utils/formatDate';
import DnsRecordsTable from './components/DnsRecordsTable/DnsRecordsTable';
import DnsVerificationResults from './components/DnsVerificationResults/DnsVerificationResults';
import ZoneFile from './components/ZoneFile/ZoneFile';
import { generateZoneFile } from './utils';
import * as SharedStyles from './shared.styled';

const S = {
    ...SharedStyles,
    InfoGrid,
    InfoItem,
    InfoLabel,
    InfoValue,
    Section,
    SectionDesc,
    SectionTitle,
    Tab,
    TabsBar,
    VerifyHeader,
};

interface Props {
    integration: Pick<Integration, 'id' | 'name' | 'provider'>;
    domain: MailboxDomain;
    dnsRecords: DNSRecord[];
}

export default function DomainShow({ integration, domain, dnsRecords }: Props) {
    const smtpHost = `mail.${domain.name}`;
    const [activeTab, setActiveTab] = useState<'table' | 'zone'>('table');
    const [copied, setCopied] = useState(false);
    const [checking, setChecking] = useState(false);
    const [dnsResult, setDnsResult] = useState<DNSCheckResult | null>(null);
    const [isVerified, setIsVerified] = useState(domain.is_verified);
    const [publicIp, setPublicIp] = useState('<SERVER_IP>');
    const zoneFile = generateZoneFile(domain, dnsRecords, publicIp);

    useEffect(() => {
        fetch('/integrations/mailbox/public-ip', {
            headers: csrfHeaders(),
        })
            .then(r => r.json())
            .then(d => { if (d.ip && d.ip !== '0.0.0.0') setPublicIp(d.ip); })
            .catch(() => {});
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(zoneFile);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    const handleCheck = async () => {
        setChecking(true);
        try {
            const res = await fetch(`/integrations/${integration.id}/mailbox/domains/${domain.id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
            });
            const result: DNSCheckResult = await res.json();
            setDnsResult(result);
            if (result.mx.valid && result.txt.valid) setIsVerified(true);
        } catch {}
        setChecking(false);
    };

    return (
        <AppLayout title={`DNS Setup - ${domain.name}`}>
            <S.Page>
                <S.Header>
                    <S.HeaderLeft>
                        <S.BackLink
                            href={`/integrations/${integration.id}/mailbox/domains`}
                            onClick={e => { e.preventDefault(); router.visit(`/integrations/${integration.id}/mailbox/domains`); }}
                        >
                            <Icon icon="lucide:arrow-left" width={14} />
                            Back to Domains
                        </S.BackLink>
                        <S.Title>DNS Setup - {domain.name}</S.Title>
                    </S.HeaderLeft>
                </S.Header>

                <S.InfoGrid>
                    <S.InfoItem>
                        <S.InfoLabel>Status</S.InfoLabel>
                        <S.InfoValue>
                            <S.StatusBadge $variant={domain.is_active ? 'success' : 'default'}>
                                {domain.is_active ? 'Active' : 'Inactive'}
                            </S.StatusBadge>
                        </S.InfoValue>
                    </S.InfoItem>
                    <S.InfoItem>
                        <S.InfoLabel>Verification</S.InfoLabel>
                        <S.InfoValue>
                            <S.StatusBadge $variant={isVerified ? 'success' : 'warning'}>
                                {isVerified ? 'Verified' : 'Pending'}
                            </S.StatusBadge>
                        </S.InfoValue>
                    </S.InfoItem>
                    <S.InfoItem>
                        <S.InfoLabel>SMTP Host</S.InfoLabel>
                        <S.InfoValue>{smtpHost}</S.InfoValue>
                    </S.InfoItem>
                    <S.InfoItem>
                        <S.InfoLabel>Created</S.InfoLabel>
                        <S.InfoValue>{formatDate(domain.created_at)}</S.InfoValue>
                    </S.InfoItem>
                </S.InfoGrid>

                <S.Section>
                    <S.SectionTitle>DNS Configuration</S.SectionTitle>
                    <S.SectionDesc>
                        Add the following DNS records to your domain registrar to receive emails at {domain.name}.
                    </S.SectionDesc>

                    <S.TabsBar>
                        <S.Tab $active={activeTab === 'table'} onClick={() => setActiveTab('table')}>Table View</S.Tab>
                        <S.Tab $active={activeTab === 'zone'} onClick={() => setActiveTab('zone')}>Zone File</S.Tab>
                    </S.TabsBar>

                    {activeTab === 'table' && (
                        <DnsRecordsTable dnsRecords={dnsRecords} publicIp={publicIp} />
                    )}

                    {activeTab === 'zone' && (
                        <ZoneFile content={zoneFile} copied={copied} onCopy={handleCopy} />
                    )}
                </S.Section>

                <S.VerifyHeader>
                    <S.SectionTitle>DNS Verification</S.SectionTitle>
                    <Button size="sm" onClick={handleCheck} loading={checking}>
                        <Icon icon="lucide:search" width={14} />
                        Check DNS Records
                    </Button>
                </S.VerifyHeader>
                <S.SectionDesc>
                    Verify that your DNS records are configured correctly for receiving emails.
                </S.SectionDesc>

                {dnsResult && <DnsVerificationResults result={dnsResult} />}
            </S.Page>
        </AppLayout>
    );
}
