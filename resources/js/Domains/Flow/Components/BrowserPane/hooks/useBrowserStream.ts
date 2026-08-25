import { useCallback, useEffect, useRef, useState } from 'react';

export type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'disconnected' | 'ended' | 'error';

interface UseBrowserStreamOptions {
    active: boolean;
    flowId: Id;
    isRunning: boolean;
    liveViewEnabled: boolean;
    runId: number;
}

function resolveStreamUrl(url: string): URL {
    const parsedUrl = new URL(url, window.location.origin);
    const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

    if (loopbackHosts.has(parsedUrl.hostname)) {
        parsedUrl.hostname = window.location.hostname;
    }

    parsedUrl.protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';

    return parsedUrl;
}

// Connects BrowserPane to a live run stream and renders incoming frames on its canvas.
export function useBrowserStream({
    active,
    flowId,
    isRunning,
    liveViewEnabled,
    runId,
}: UseBrowserStreamOptions) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const metaRef = useRef<{ deviceWidth: number; deviceHeight: number } | null>(null);
    const pendingMetaRef = useRef<{ deviceWidth: number; deviceHeight: number; tabName?: string } | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const disposedSocketsRef = useRef(new WeakSet<WebSocket>());
    const frameUrlRef = useRef<string | null>(null);
    const urlFocusedRef = useRef(false);
    const activeRef = useRef(active);
    const isRunningRef = useRef(isRunning);
    const canControlRef = useRef(false);
    const canInteractRef = useRef(false);
    const activeTabNameRef = useRef<string | null>(null);
    const tabUrlsRef = useRef(new Map<string, string>());

    const [status, setStatus] = useState<ConnectionStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [tabs, setTabs] = useState<string[]>([]);
    const [activeTabName, setActiveTabName] = useState<string | null>(null);
    const [canControl, setCanControl] = useState(false);

    activeRef.current = active;
    isRunningRef.current = isRunning;

    const send = useCallback((message: Record<string, unknown>) => {
        if (canControlRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const disposeSocket = useCallback(() => {
        if (wsRef.current) {
            disposedSocketsRef.current.add(wsRef.current);
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const drawFrame = useCallback((blob: Blob, onPaint?: () => void) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        if (frameUrlRef.current) {
            URL.revokeObjectURL(frameUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(blob);
        frameUrlRef.current = objectUrl;

        if (!imgRef.current) {
            imgRef.current = new Image();
        }

        const image = imgRef.current;
        image.onload = () => {
            if (canvas.width !== image.width || canvas.height !== image.height) {
                canvas.width = image.width;
                canvas.height = image.height;
            }
            context.drawImage(image, 0, 0);
            onPaint?.();
        };
        image.src = objectUrl;
    }, []);

    const connect = useCallback(async () => {
        disposeSocket();

        setStatus('connecting');
        setError(null);
        canControlRef.current = false;
        canInteractRef.current = false;
        setCanControl(false);

        let tokenResponse: Response;
        try {
            tokenResponse = await fetch(`/flows/${encodeURIComponent(flowId)}/runs/${runId}/stream-token`, {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        } catch {
            setStatus('error');
            setError('Unable to authorize browser stream');
            return;
        }

        if (tokenResponse.status === 409) {
            reconnectRef.current = setTimeout(() => {
                reconnectRef.current = null;
                if (activeRef.current && isRunningRef.current) {
                    connect();
                }
            }, 1000);
            return;
        }

        if (!tokenResponse.ok) {
            setStatus('error');
            setError(tokenResponse.status === 403
                ? 'You are not authorized to view this browser stream'
                : 'Unable to authorize browser stream');
            return;
        }

        let capability: { url: string; protocol: string; can_control: boolean };
        try {
            capability = await tokenResponse.json() as { url: string; protocol: string; can_control: boolean };
        } catch {
            setStatus('error');
            setError('Invalid browser stream authorization response');
            return;
        }
        if (
            typeof capability.url !== 'string'
            || !/^puppetflow-v1\.\d+\.[a-f0-9]{64}$/.test(capability.protocol)
            || typeof capability.can_control !== 'boolean'
        ) {
            setStatus('error');
            setError('Invalid browser stream authorization response');
            return;
        }
        if (!activeRef.current || !isRunningRef.current) return;

        canControlRef.current = capability.can_control;
        setCanControl(capability.can_control);
        const parsedUrl = resolveStreamUrl(capability.url);
        const socket = new WebSocket(parsedUrl.toString(), capability.protocol);
        wsRef.current = socket;
        socket.binaryType = 'arraybuffer';

        socket.onopen = () => {
            setStatus('connecting');
        };

        socket.onmessage = (event) => {
            if (typeof event.data === 'string') {
                try {
                    const message = JSON.parse(event.data);

                    if (
                        message.type === 'tabs'
                        && Array.isArray(message.tabs)
                        && message.tabs.every((tabName: unknown) => typeof tabName === 'string')
                        && (
                            (message.tabs.length === 0 && message.activeTabName === null)
                            || (typeof message.activeTabName === 'string' && message.tabs.includes(message.activeTabName))
                        )
                    ) {
                        const nextTabs = [...new Set(message.tabs as string[])];
                        if (activeTabNameRef.current !== message.activeTabName) {
                            canInteractRef.current = false;
                            metaRef.current = null;
                        }
                        activeTabNameRef.current = message.activeTabName;
                        setTabs(nextTabs);
                        setActiveTabName(message.activeTabName);
                        const tabUrl = message.activeTabName
                            ? tabUrlsRef.current.get(message.activeTabName)
                            : undefined;
                        if (tabUrl !== undefined) {
                            setCurrentUrl(tabUrl);
                            if (!urlFocusedRef.current) setUrlInput(tabUrl);
                        } else if (message.activeTabName === null) {
                            setCurrentUrl('');
                            if (!urlFocusedRef.current) setUrlInput('');
                        }
                    } else if (message.type === 'status') {
                        setStatus(message.status as ConnectionStatus);
                    } else if (message.type === 'error') {
                        setError(message.message);
                        setStatus('error');
                    } else if (message.type === 'frame-meta') {
                        pendingMetaRef.current = {
                            deviceWidth: message.metadata.deviceWidth,
                            deviceHeight: message.metadata.deviceHeight,
                            ...(typeof message.tabName === 'string' ? { tabName: message.tabName } : {}),
                        };
                    } else if (message.type === 'url') {
                        const tabName = typeof message.tabName === 'string'
                            ? message.tabName
                            : activeTabNameRef.current;
                        if (tabName) tabUrlsRef.current.set(tabName, message.url);
                        if (!tabName || tabName === activeTabNameRef.current) {
                            setCurrentUrl(message.url);
                            if (!urlFocusedRef.current) {
                                setUrlInput(message.url);
                            }
                        }
                    } else if (message.type === 'clipboard' && typeof message.text === 'string') {
                        navigator.clipboard?.writeText(message.text).catch(() => {});
                    }
                } catch (_) {}
            } else {
                if (pendingMetaRef.current) {
                    const frameMeta = pendingMetaRef.current;
                    pendingMetaRef.current = null;
                    if (frameMeta.tabName && frameMeta.tabName !== activeTabNameRef.current) return;
                    metaRef.current = frameMeta;
                    const frameTabName = frameMeta.tabName ?? activeTabNameRef.current;
                    drawFrame(new Blob([event.data], { type: 'image/jpeg' }), () => {
                        if (!frameTabName || frameTabName === activeTabNameRef.current) {
                            canInteractRef.current = canControlRef.current;
                        }
                    });
                    return;
                }
                drawFrame(new Blob([event.data], { type: 'image/jpeg' }));
            }
        };

        socket.onerror = () => {
            setStatus('error');
            setError('WebSocket connection failed');
        };

        socket.onclose = () => {
            const wasCurrentSocket = wsRef.current === socket;
            if (wasCurrentSocket) {
                wsRef.current = null;
                canControlRef.current = false;
                canInteractRef.current = false;
                setCanControl(false);
                if (isRunningRef.current) setStatus('disconnected');
            }
            if (wasCurrentSocket && !disposedSocketsRef.current.has(socket) && isRunningRef.current) {
                reconnectRef.current = setTimeout(() => {
                    if (activeRef.current && isRunningRef.current) {
                        connect();
                    }
                }, 2000);
            }
        };
    }, [disposeSocket, drawFrame, flowId, runId]);

    useEffect(() => {
        activeTabNameRef.current = null;
        canInteractRef.current = false;
        tabUrlsRef.current.clear();
        setTabs([]);
        setActiveTabName(null);
        setCurrentUrl('');
        setUrlInput('');
    }, [runId]);

    useEffect(() => {
        if (active && isRunning && runId && liveViewEnabled) {
            const delay = setTimeout(() => connect(), 300);
            return () => {
                clearTimeout(delay);
                if (reconnectRef.current) clearTimeout(reconnectRef.current);
                disposeSocket();
            };
        }

        return () => {
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            disposeSocket();
        };
    }, [active, connect, disposeSocket, isRunning, liveViewEnabled, runId]);

    useEffect(() => {
        return () => {
            if (frameUrlRef.current) {
                URL.revokeObjectURL(frameUrlRef.current);
            }
        };
    }, []);

    const setUrlFocused = useCallback((focused: boolean) => {
        urlFocusedRef.current = focused;
    }, []);

    return {
        canvasRef,
        activeTabName,
        canControl,
        canInteractRef,
        connect,
        currentUrl,
        error,
        metaRef,
        send,
        setUrlFocused,
        setUrlInput,
        status,
        tabs,
        urlInput,
    };
}
