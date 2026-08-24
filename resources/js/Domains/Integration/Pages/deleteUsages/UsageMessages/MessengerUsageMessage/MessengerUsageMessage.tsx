import { FlowUsageList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/FlowUsageList/FlowUsageList';
import { ItemUsageList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/ItemUsageList/ItemUsageList';
import { type FlowUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';

interface MessengerUsageMessageProps {
    channels: { id: string; name: string; provider: string; scope: string }[];
    flows: FlowUsage[];
}

const providerIcons: Record<string, string> = {
    telegram: 'logos:telegram',
    discord: 'logos:discord-icon',
    slack: 'logos:slack-icon',
};

export function MessengerUsageMessage({ channels, flows }: MessengerUsageMessageProps) {
    return (
        <>
            {channels.length > 0 && (
                <>
                    {'\n\n'}{channels.length} channel(s) will be deleted:
                    <ItemUsageList
                        items={channels.map(channel => ({
                            key: channel.id,
                            label: channel.name,
                            icon: providerIcons[channel.provider] || 'lucide:hash',
                        }))}
                    />
                </>
            )}
            {flows.length > 0 && (
                <>
                    {'\n\n'}Used in {flows.length} flow(s):
                    <FlowUsageList flows={flows} />
                </>
            )}
        </>
    );
}
