import { useCallback, useEffect, useRef, type RefObject } from 'react';

const MOUSE_BUTTON_MAP: Record<number, string> = {
    0: 'left',
    1: 'middle',
    2: 'right',
};

function getModifiers(event: MouseEvent | KeyboardEvent | WheelEvent): number {
    let modifiers = 0;
    if (event.altKey) modifiers |= 1;
    if (event.ctrlKey) modifiers |= 2;
    if (event.metaKey) modifiers |= 4;
    if (event.shiftKey) modifiers |= 8;
    return modifiers;
}

interface UseRemoteBrowserInputOptions {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    canInteractRef: RefObject<boolean>;
    metaRef: RefObject<{ deviceWidth: number; deviceHeight: number } | null>;
    send: (message: Record<string, unknown>) => void;
}

// Translates local canvas input into scaled control messages for the remote browser.
export function useRemoteBrowserInput({
    canvasRef,
    canInteractRef,
    metaRef,
    send,
}: UseRemoteBrowserInputOptions) {
    const lastPasteRef = useRef<{ text: string; at: number } | null>(null);

    const sendPasteText = useCallback((text: string | null | undefined) => {
        if (!canInteractRef.current) return;
        const now = Date.now();
        const lastPaste = lastPasteRef.current;

        if (text && (!lastPaste || lastPaste.text !== text || now - lastPaste.at > 250)) {
            lastPasteRef.current = { text, at: now };
            send({ type: 'paste', text });
        }
    }, [canInteractRef, send]);

    const scaleCoords = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        const meta = metaRef.current;
        if (!canInteractRef.current || !canvas || !meta) return null;

        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((clientX - rect.left) * (meta.deviceWidth / rect.width)),
            y: Math.round((clientY - rect.top) * (meta.deviceHeight / rect.height)),
        };
    }, [canInteractRef, canvasRef, metaRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onMouseMove = (event: MouseEvent) => {
            const coords = scaleCoords(event.clientX, event.clientY);
            if (coords) {
                send({ type: 'mousemove', ...coords, modifiers: getModifiers(event) });
            }
        };

        const onMouseDown = (event: MouseEvent) => {
            event.preventDefault();
            canvas.focus();
            const coords = scaleCoords(event.clientX, event.clientY);
            if (coords) {
                send({
                    type: 'mousedown',
                    ...coords,
                    button: MOUSE_BUTTON_MAP[event.button] || 'left',
                    buttons: event.buttons,
                    clickCount: event.detail,
                    modifiers: getModifiers(event),
                });
            }
        };

        const onMouseUp = (event: MouseEvent) => {
            event.preventDefault();
            const coords = scaleCoords(event.clientX, event.clientY);
            if (coords) {
                send({
                    type: 'mouseup',
                    ...coords,
                    button: MOUSE_BUTTON_MAP[event.button] || 'left',
                    clickCount: event.detail,
                    modifiers: getModifiers(event),
                });
            }
        };

        const onWheel = (event: WheelEvent) => {
            if (!canInteractRef.current) return;
            event.preventDefault();
            const meta = metaRef.current;
            if (!meta) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.round((event.clientX - rect.left) * (meta.deviceWidth / rect.width));
            const y = Math.round((event.clientY - rect.top) * (meta.deviceHeight / rect.height));
            send({
                type: 'wheel',
                x,
                y,
                deltaX: event.deltaX,
                deltaY: event.deltaY,
                modifiers: getModifiers(event),
            });
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (!canInteractRef.current) return;
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
                event.preventDefault();
                event.stopPropagation();
                send({ type: 'copy' });
                return;
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'x') {
                event.preventDefault();
                event.stopPropagation();
                send({ type: 'cut' });
                return;
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
                event.stopPropagation();
                navigator.clipboard?.readText()
                    .then(sendPasteText)
                    .catch(() => {});
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            send({
                type: 'keydown',
                key: event.key,
                code: event.code,
                keyCode: event.keyCode,
                text: event.key.length === 1 ? event.key : '',
                modifiers: getModifiers(event),
            });
        };

        const onKeyUp = (event: KeyboardEvent) => {
            if (!canInteractRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            send({
                type: 'keyup',
                key: event.key,
                code: event.code,
                keyCode: event.keyCode,
                modifiers: getModifiers(event),
            });
        };

        const onPaste = (event: ClipboardEvent) => {
            if (!canInteractRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            sendPasteText(event.clipboardData?.getData('text/plain'));
        };

        const onContextMenu = (event: MouseEvent) => {
            event.preventDefault();
        };

        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('keydown', onKeyDown);
        canvas.addEventListener('keyup', onKeyUp);
        canvas.addEventListener('paste', onPaste);
        canvas.addEventListener('contextmenu', onContextMenu);

        return () => {
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('keydown', onKeyDown);
            canvas.removeEventListener('keyup', onKeyUp);
            canvas.removeEventListener('paste', onPaste);
            canvas.removeEventListener('contextmenu', onContextMenu);
        };
    }, [canInteractRef, canvasRef, metaRef, scaleCoords, send, sendPasteText]);
}
