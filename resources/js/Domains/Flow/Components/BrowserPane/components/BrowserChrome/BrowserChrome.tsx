import { useCallback, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { ConnectionStatus } from '@/Domains/Flow/Components/BrowserPane/hooks/useBrowserStream';
import * as S from './styled';

const STATUS_ICON: Record<ConnectionStatus, string> = {
    idle: 'lucide:monitor',
    connecting: 'lucide:loader-2',
    streaming: 'lucide:monitor-check',
    disconnected: 'lucide:monitor-x',
    ended: 'lucide:monitor-x',
    error: 'lucide:alert-triangle',
};

interface BrowserChromeProps {
    currentUrl: string;
    send: (message: Record<string, unknown>) => void;
    setUrlFocused: (focused: boolean) => void;
    setUrlInput: (url: string) => void;
    showCanvas: boolean;
    showRecording: boolean;
    status: ConnectionStatus;
    urlInput: string;
}

export default function BrowserChrome({
    currentUrl,
    send,
    setUrlFocused,
    setUrlInput,
    showCanvas,
    showRecording,
    status,
    urlInput,
}: BrowserChromeProps) {
    const [, setFocused] = useState(false);

    const handleNavigate = useCallback((url: string) => {
        let normalized = url.trim();
        if (normalized && !/^https?:\/\//i.test(normalized)) {
            normalized = 'https://' + normalized;
        }
        if (normalized) {
            send({ type: 'navigate', url: normalized });
            setUrlInput(normalized);
        }
    }, [send, setUrlInput]);

    const handleUrlKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
            handleNavigate(urlInput);
        }
        if (event.key === 'Escape') {
            setUrlInput(currentUrl);
            event.currentTarget.blur();
        }
    }, [currentUrl, handleNavigate, setUrlInput, urlInput]);

    const handleFocusChange = useCallback((focused: boolean) => {
        setFocused(focused);
        setUrlFocused(focused);
    }, [setUrlFocused]);

    return (
        <S.Chrome>
            <S.NavButton onClick={() => send({ type: 'goBack' })} disabled={!showCanvas} title="Back">
                <Icon icon="lucide:chevron-left" width={15} height={15} />
            </S.NavButton>
            <S.NavButton onClick={() => send({ type: 'goForward' })} disabled={!showCanvas} title="Forward">
                <Icon icon="lucide:chevron-right" width={15} height={15} />
            </S.NavButton>
            <S.AddressBar>
                <S.AddressBarIcon>
                    {showRecording ? (
                        <Icon icon="lucide:play-circle" width={12} height={12} />
                    ) : (
                        <Icon icon={currentUrl.startsWith('https') ? 'lucide:lock' : 'lucide:building-2'} width={12} height={12} />
                    )}
                </S.AddressBarIcon>
                {showRecording ? (
                    <S.AddressBarLabel>Session recording</S.AddressBarLabel>
                ) : (
                    <S.AddressBarInput
                        type="text"
                        value={urlInput}
                        onChange={(event) => setUrlInput(event.target.value)}
                        onKeyDown={handleUrlKeyDown}
                        onFocus={() => handleFocusChange(true)}
                        onBlur={() => handleFocusChange(false)}
                        placeholder="about:blank"
                        spellCheck={false}
                        disabled={!showCanvas}
                    />
                )}
            </S.AddressBar>
            {showRecording ? (
                <S.RecordingBadge>
                    <Icon icon="lucide:video" width={11} height={11} />
                    REC
                </S.RecordingBadge>
            ) : (
                <S.StatusChip $status={status}>
                    <Icon
                        icon={STATUS_ICON[status]}
                        width={11}
                        height={11}
                        className={status === 'connecting' ? 'spin' : undefined}
                    />
                    {status === 'streaming' && <S.LiveDotSmall />}
                </S.StatusChip>
            )}
        </S.Chrome>
    );
}
