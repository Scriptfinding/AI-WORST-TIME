import { useState } from 'react';
import axios from 'axios';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import ChannelSearchSelect from '@/Domains/NotificationChannel/Pages/ChannelSearchSelect';
import type { ChatOption, DetectResult } from '@/Domains/NotificationChannel/Pages/ChannelFormModal/utils';
import * as S from './styled';

interface Props {
    integrationId: Id;
    provider?: string;
    chatOptions: ChatOption[];
    selectedChatId: string;
    detectResult: DetectResult | null;
    onChatOptionsChange: (options: ChatOption[]) => void;
    onSelectedChatIdChange: (id: string) => void;
    onDetectResultChange: (result: DetectResult | null) => void;
}

export default function ChatDetection({
    integrationId,
    provider,
    chatOptions,
    selectedChatId,
    detectResult,
    onChatOptionsChange,
    onSelectedChatIdChange,
    onDetectResultChange,
}: Props) {
    const [detecting, setDetecting] = useState(false);

    const handleDetect = async () => {
        setDetecting(true);
        onDetectResultChange(null);
        onChatOptionsChange([]);
        onSelectedChatIdChange('');
        try {
            const { data } = await axios.get(`/integrations/${integrationId}/chats`);
            if (data.channels) {
                onChatOptionsChange(data.channels);
            } else if (data.chat_id) {
                const detectedChat = {
                    id: data.chat_id as string,
                    name: (data.chat_name || data.chat_id) as string,
                };
                onChatOptionsChange([detectedChat]);
                onDetectResultChange({
                    ok: true,
                    chat_id: detectedChat.id,
                    chat_name: detectedChat.name,
                });
                onSelectedChatIdChange(data.chat_id);
            } else if (!data.ok) {
                onDetectResultChange({ ok: false, error: data.error || 'Detection failed' });
            }
        } catch {
            onDetectResultChange({ ok: false, error: 'Network error' });
        } finally {
            setDetecting(false);
        }
    };

    const handleChatSelect = (chatId: string) => {
        onSelectedChatIdChange(chatId);
        const chat = chatOptions.find(option => option.id === chatId);
        if (!chat) return;

        onDetectResultChange({ ok: true, chat_id: chat.id, chat_name: chat.name });
    };

    return (
        <S.Container>
            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDetect}
                disabled={detecting}
                loading={detecting}
            >
                <Icon icon="lucide:search" width={14} />
                {detecting ? 'Detecting...' : 'Detect chats'}
            </Button>

            {detectResult && !detectResult.ok && chatOptions.length === 0 && (
                <S.Result>
                    <Icon icon="lucide:x-circle" width={16} />
                    {detectResult.error}
                </S.Result>
            )}

            {chatOptions.length > 0 && (
                <div>
                    <S.SelectLabel>
                        {provider ? `${provider.charAt(0).toUpperCase()}${provider.slice(1)} channel` : 'Channel'}
                    </S.SelectLabel>
                    <ChannelSearchSelect options={chatOptions} value={selectedChatId} onChange={handleChatSelect} />
                </div>
            )}
        </S.Container>
    );
}
