import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { useToast } from '@/App/Hooks/useToast';
import GrabberOnboarding from './GrabberOnboarding';

const PROTOCOL_VERSION = 1 as const;
const CHANNEL = '__PUPPETFLOW_GRABBER__';
const PORT_NAME = 'puppetflow-grabber';
const CONNECT_TIMEOUT_MS = 2500;
const ONBOARDING_DISMISSED_KEY = 'puppetflow_grabber_onboarding_dismissed';

type ExtractionMode = 'minimal' | 'selector' | 'js-path' | 'xpath' | 'full-xpath';

type GrabberResult = {
    selector: string;
    extractionMode?: ExtractionMode;
    extractionLabel?: string;
    pageUrl: string;
    tagName: string;
    matchCount: number;
};

type ExtensionMessage = {
    v: number;
    type: 'pick.accepted' | 'pick.result' | 'pick.cancelled' | 'pick.error';
    requestId: string;
    selector?: string;
    extractionMode?: ExtractionMode;
    extractionLabel?: string;
    pageUrl?: string;
    tagName?: string;
    matchCount?: number;
    message?: string;
    reason?: string;
};

type RuntimePort = {
    postMessage: (message: unknown) => void;
    disconnect: () => void;
    onMessage: { addListener: (listener: (message: unknown) => void) => void };
    onDisconnect: { addListener: (listener: () => void) => void };
};

type PendingGrab = {
    resolve: (result: GrabberResult) => void;
    reject: (error: Error) => void;
    connectTimeout: ReturnType<typeof setTimeout>;
};

type OnboardingIntent = {
    targetUrl?: string | null;
    resolve: (result: GrabberResult) => void;
    reject: (error: Error) => void;
};

interface GrabberContextValue {
    available: boolean;
    activeRequestId: string | null;
    grabSelector: (
        targetUrl?: string | null,
        options?: { forceOnboarding?: boolean },
    ) => Promise<GrabberResult>;
    cancelGrab: () => void;
}

const GrabberContext = createContext<GrabberContextValue | null>(null);

const getChromeRuntime = () => {
    const runtime = (globalThis as typeof globalThis & {
        chrome?: { runtime?: { connect?: (extensionId: string, options: { name: string }) => RuntimePort } };
    }).chrome?.runtime;
    return runtime?.connect ? runtime : null;
};

export function GrabberProvider({
    children,
    storeUrl,
}: {
    children: ReactNode;
    storeUrl: string;
}) {
    const { toast } = useToast();
    const [available, setAvailable] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const pendingRef = useRef(new Map<string, PendingGrab>());
    const onboardingIntentRef = useRef<OnboardingIntent | null>(null);
    const portRef = useRef<RuntimePort | null>(null);
    const directConnectionAttemptedRef = useRef(false);

    const handleExtensionMessage = useCallback((message: ExtensionMessage) => {
        if (message.v !== PROTOCOL_VERSION) return;
        const pending = pendingRef.current.get(message.requestId);
        if (!pending) return;

        if (message.type === 'pick.accepted') {
            clearTimeout(pending.connectTimeout);
            setAvailable(true);
            return;
        }

        clearTimeout(pending.connectTimeout);
        pendingRef.current.delete(message.requestId);
        setActiveRequestId(current => current === message.requestId ? null : current);
        if (
            message.type === 'pick.result'
            && message.selector
            && message.pageUrl
            && message.tagName
            && typeof message.matchCount === 'number'
        ) {
            pending.resolve({
                selector: message.selector,
                extractionMode: message.extractionMode,
                extractionLabel: message.extractionLabel,
                pageUrl: message.pageUrl,
                tagName: message.tagName,
                matchCount: message.matchCount,
            });
            toast(`${message.extractionLabel ?? 'Element path'} captured for <${message.tagName}>.`);
            return;
        }

        const errorMessage = message.type === 'pick.error'
            ? message.message ?? 'Puppetflow Grabber could not select this element.'
            : `Grab cancelled${message.reason ? `: ${message.reason}` : ''}.`;
        pending.reject(new Error(errorMessage));
        if (message.type === 'pick.error') toast(errorMessage, 'error');
    }, [toast]);

    const connectDirectly = useCallback(() => {
        if (directConnectionAttemptedRef.current) return portRef.current;
        directConnectionAttemptedRef.current = true;
        const extensionId = (
            import.meta as ImportMeta & { env?: Record<string, string | undefined> }
        ).env?.VITE_PUPPETFLOW_GRABBER_EXTENSION_ID;
        const runtime = getChromeRuntime();
        if (!extensionId || !runtime?.connect) return null;

        try {
            const port = runtime.connect(extensionId, { name: PORT_NAME });
            portRef.current = port;
            port.onMessage.addListener(value => {
                handleExtensionMessage(value as ExtensionMessage);
            });
            port.onDisconnect.addListener(() => {
                if (portRef.current === port) portRef.current = null;
            });
            setAvailable(true);
            return port;
        } catch {
            return null;
        }
    }, [handleExtensionMessage]);

    useEffect(() => {
        connectDirectly();
        const listener = (event: MessageEvent) => {
            if (
                event.source !== window
                || event.origin !== window.location.origin
                || event.data?.channel !== CHANNEL
                || event.data?.source !== 'extension'
            ) return;
            const message = event.data.message;
            if (message?.type === 'bridge.present') {
                setAvailable(true);
                return;
            }
            if (message?.type === 'bridge.disconnected') {
                setAvailable(false);
                return;
            }
            handleExtensionMessage(message as ExtensionMessage);
        };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, [connectDirectly, handleExtensionMessage]);

    useEffect(() => () => {
        portRef.current?.disconnect();
        for (const pending of pendingRef.current.values()) {
            clearTimeout(pending.connectTimeout);
            pending.reject(new Error('The Flow Editor was closed.'));
        }
        pendingRef.current.clear();
        onboardingIntentRef.current?.reject(new Error('The Flow Editor was closed.'));
        onboardingIntentRef.current = null;
    }, []);

    const send = useCallback((message: unknown) => {
        const port = portRef.current ?? connectDirectly();
        if (port) {
            port.postMessage(message);
            return;
        }
        window.postMessage({ channel: CHANNEL, source: 'editor', message }, window.location.origin);
    }, [connectDirectly]);

    const cancelGrab = useCallback(() => {
        if (!activeRequestId) return;
        send({
            v: PROTOCOL_VERSION,
            type: 'pick.cancel',
            requestId: activeRequestId,
        });
    }, [activeRequestId, send]);

    const startGrab = useCallback((targetUrl?: string | null) => {
        cancelGrab();
        const requestId = crypto.randomUUID();
        setActiveRequestId(requestId);
        return new Promise<GrabberResult>((resolve, reject) => {
            const connectTimeout = setTimeout(() => {
                pendingRef.current.delete(requestId);
                setActiveRequestId(current => current === requestId ? null : current);
                setAvailable(false);
                const error = new Error(
                    'Puppetflow Grabber is not connected. Install or reload the extension.',
                );
                reject(error);
                toast(error.message, 'error');
            }, CONNECT_TIMEOUT_MS);
            pendingRef.current.set(requestId, { resolve, reject, connectTimeout });
            send({
                v: PROTOCOL_VERSION,
                type: 'pick.start',
                requestId,
                targetUrl: targetUrl ?? null,
            });
        });
    }, [cancelGrab, send, toast]);

    const closeOnboarding = useCallback(() => {
        setShowOnboarding(false);
        onboardingIntentRef.current?.reject(new Error('Grab cancelled.'));
        onboardingIntentRef.current = null;
    }, []);

    const startOnboardingGrab = useCallback(() => {
        const intent = onboardingIntentRef.current;
        if (!intent) return;
        onboardingIntentRef.current = null;
        setShowOnboarding(false);
        void startGrab(intent.targetUrl).then(intent.resolve, intent.reject);
    }, [startGrab]);

    const dismissFutureOnboarding = useCallback(() => {
        window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    }, []);

    const grabSelector = useCallback((
        targetUrl?: string | null,
        options?: { forceOnboarding?: boolean },
    ) => {
        if (
            !options?.forceOnboarding
            && window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true'
        ) {
            return startGrab(targetUrl);
        }

        onboardingIntentRef.current?.reject(new Error('A newer grab request replaced this one.'));
        setShowOnboarding(true);
        return new Promise<GrabberResult>((resolve, reject) => {
            onboardingIntentRef.current = { targetUrl, resolve, reject };
        });
    }, [startGrab]);

    const value = useMemo<GrabberContextValue>(() => ({
        available,
        activeRequestId,
        grabSelector,
        cancelGrab,
    }), [activeRequestId, available, cancelGrab, grabSelector]);

    return (
        <GrabberContext.Provider value={value}>
            {children}
            {showOnboarding && (
                <GrabberOnboarding
                    storeUrl={storeUrl}
                    onClose={closeOnboarding}
                    onStart={startOnboardingGrab}
                    onDismissFuture={dismissFutureOnboarding}
                />
            )}
        </GrabberContext.Provider>
    );
}

export const useGrabber = () => {
    const context = useContext(GrabberContext);
    if (!context) throw new Error('useGrabber must be used inside GrabberProvider.');
    return context;
};
