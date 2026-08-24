import { useCallback, useEffect, useRef, useState } from 'react';
import type { DNSCheckResult, DNSRecord, MailboxDomain } from '@/Domains/Mailbox/types';
import { fetchJson, generateZoneFile } from './utils';

interface DnsSetupOptions {
    integrationId: Id | null;
    isReadonly: boolean;
    onOpen: () => void;
    onVerified?: (domain: MailboxDomain) => void;
}

// Loads DNS setup data and controls verification and copy feedback for a domain.
export default function useMailboxDnsSetup({
    integrationId,
    isReadonly,
    onOpen,
    onVerified,
}: DnsSetupOptions) {
    const [activeDomain, setActiveDomain] = useState<MailboxDomain | null>(null);
    const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'table' | 'zone'>('table');
    const [copied, setCopied] = useState(false);
    const [checking, setChecking] = useState(false);
    const [dnsResult, setDnsResult] = useState<DNSCheckResult | null>(null);
    const [publicIp, setPublicIp] = useState('<SERVER_IP>');
    const setupRequestRef = useRef<AbortController | null>(null);
    const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const verifiedCallbackDomainIdsRef = useRef(new Set<number>());

    useEffect(() => {
        const controller = new AbortController();
        fetchJson('/integrations/mailbox/public-ip', { signal: controller.signal })
            .then(response => response.json())
            .then(data => {
                if (data.ip && data.ip !== '0.0.0.0') setPublicIp(data.ip);
            })
            .catch(() => {});
        return () => controller.abort();
    }, []);

    useEffect(() => () => {
        setupRequestRef.current?.abort();
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    }, []);

    const openDomainSetup = useCallback(async (
        domain: MailboxDomain,
        overrideIntegrationId?: Id
    ) => {
        setupRequestRef.current?.abort();
        setActiveDomain(domain);
        setDnsRecords([]);
        setDnsResult(null);
        setActiveTab('table');
        onOpen();

        const id = overrideIntegrationId ?? integrationId;
        if (!id) return;
        const controller = new AbortController();
        setupRequestRef.current = controller;
        try {
            const response = await fetchJson(
                `/integrations/${id}/mailbox/domains/${domain.id}`,
                { signal: controller.signal }
            );
            const data = await response.json();
            if (data.dnsRecords) setDnsRecords(data.dnsRecords);
            if (data.domain) setActiveDomain(data.domain);
        } catch {}
    }, [integrationId, onOpen]);

    const clearActiveDomain = useCallback(() => {
        setupRequestRef.current?.abort();
        setActiveDomain(null);
    }, []);

    const handleCopy = async () => {
        if (!activeDomain) return;
        try {
            await navigator.clipboard.writeText(generateZoneFile(activeDomain, dnsRecords, publicIp));
            setCopied(true);
            if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    const handleCheckDns = async () => {
        if (isReadonly || !integrationId || !activeDomain) return;
        setChecking(true);
        try {
            const response = await fetchJson(
                `/integrations/${integrationId}/mailbox/domains/${activeDomain.id}/verify`,
                { method: 'POST' }
            );
            const result: DNSCheckResult = await response.json();
            setDnsResult(result);
            if (result.mx.valid && result.txt.valid) {
                const verifiedDomain = { ...activeDomain, is_verified: true };
                setActiveDomain(verifiedDomain);
                if (!verifiedCallbackDomainIdsRef.current.has(verifiedDomain.id)) {
                    verifiedCallbackDomainIdsRef.current.add(verifiedDomain.id);
                    onVerified?.(verifiedDomain);
                }
            }
        } catch {}
        setChecking(false);
    };

    return {
        activeDomain, dnsRecords, activeTab, copied, checking, dnsResult, publicIp,
        openDomainSetup, clearActiveDomain, handleCopy, handleCheckDns, setActiveTab,
    };
}
