import { useEffect, useState } from 'react';
import { fetchAiModelSuggestions } from '@/Domains/AiModel/aiModelSuggestions';
import { fetchChannelSuggestions } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { fetchMailboxWatcherSuggestions } from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';

export function useActionResourceLabels(flowId?: Id): ReadonlyMap<string, string> {
    const [labels, setLabels] = useState<ReadonlyMap<string, string>>(new Map());

    useEffect(() => {
        let cancelled = false;

        void Promise.all([
            fetchChannelSuggestions(),
            fetchAiModelSuggestions(),
            flowId ? fetchMailboxWatcherSuggestions(flowId) : Promise.resolve([]),
        ]).then(([channels, aiModels, watchers]) => {
            if (cancelled) return;

            const nextLabels = new Map<string, string>();
            channels.forEach(channel => {
                const destination = channel.destination.trim();
                if (destination) {
                    nextLabels.set(String(channel.id), `#${destination.replace(/^#+/, '')}`);
                }
            });
            aiModels.forEach(model => {
                if (model.ai_model_id) {
                    nextLabels.set(String(model.id), model.ai_model_id);
                }
            });
            watchers.forEach(watcher => {
                if (watcher.address) {
                    nextLabels.set(String(watcher.id), watcher.address);
                }
            });

            setLabels(nextLabels);
        });

        return () => {
            cancelled = true;
        };
    }, [flowId]);

    return labels;
}
