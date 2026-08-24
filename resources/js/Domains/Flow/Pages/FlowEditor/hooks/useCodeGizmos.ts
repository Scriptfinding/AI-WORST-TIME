import { useEffect, useMemo, useRef } from 'react';
import { getLocalIconUrl } from '@/Shared/UI/Icon/Icon';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import {
    getCodeGizmos,
    type CodeGizmo,
} from '@/Domains/Flow/Pages/FlowEditor/utils/codeGizmos';

type MonacoInstance = Parameters<OnMount>[1];

interface UseCodeGizmosOptions {
    code: string;
    editorInstance: editor.IStandaloneCodeEditor | null;
    monacoInstance: MonacoInstance | null;
    selectorGizmos?: boolean;
    onGizmoClick?: (gizmo: CodeGizmo, forceOnboarding?: boolean) => void;
}

const gizmoIconUrlCache = new Map<string, Promise<string>>();
let nextGizmoScopeId = 0;

const getGizmoIconUrl = (iconName: string, color: string) => {
    const cacheKey = `${iconName}:${color}`;
    const cached = gizmoIconUrlCache.get(cacheKey);
    if (cached) return cached;

    const iconUrl = fetch(getLocalIconUrl(iconName)).then(async response => {
        if (!response.ok) {
            throw new Error(`Unable to load local icon ${iconName}`);
        }

        const svg = (await response.text())
            .replace('<svg ', `<svg color="${color}" `)
            .replace(/\bwidth="[^"]*"/, 'width="16"')
            .replace(/\bheight="[^"]*"/, 'height="16"');

        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    });
    gizmoIconUrlCache.set(cacheKey, iconUrl);
    return iconUrl;
};

export const useCodeGizmos = ({
    code,
    editorInstance,
    monacoInstance,
    selectorGizmos = true,
    onGizmoClick,
}: UseCodeGizmosOptions) => {
    const gizmoScopeClassRef = useRef<string | null>(null);
    if (!gizmoScopeClassRef.current) {
        gizmoScopeClassRef.current = `nop-code-gizmos-${nextGizmoScopeId++}`;
    }
    const gizmoScopeClass = gizmoScopeClassRef.current;
    const gizmos = useMemo(
        () => getCodeGizmos(code).filter(gizmo => selectorGizmos || gizmo.kind !== 'selector'),
        [code, selectorGizmos],
    );
    const gizmoDecorations = useMemo(() => {
        if (!monacoInstance) return [];

        return gizmos.flatMap((gizmo, index): editor.IModelDeltaDecoration[] => {
            const range = new monacoInstance.Range(gizmo.lineNumber, 1, gizmo.lineNumber, 1);
            const decorations: editor.IModelDeltaDecoration[] = [{
                range,
                options: {
                    glyphMarginClassName: `nop-code-gizmo ${gizmo.kind === 'selector' ? 'nop-code-gizmo-selector' : ''} ${gizmoScopeClass}-${index} ${gizmoScopeClass}-click-${index}`,
                    glyphMarginHoverMessage: { value: gizmo.description },
                    glyphMargin: {
                        position: gizmo.kind === 'selector'
                            ? monacoInstance.editor.GlyphMarginLane.Right
                            : monacoInstance.editor.GlyphMarginLane.Left,
                    },
                },
            }];

            if (gizmo.faviconUrl) {
                decorations.push({
                    range,
                    options: {
                        glyphMarginClassName: `nop-code-gizmo-favicon ${gizmoScopeClass}-favicon-${index} ${gizmoScopeClass}-click-${index}`,
                        glyphMarginHoverMessage: { value: gizmo.siteHostname ?? gizmo.name },
                        glyphMargin: {
                            position: monacoInstance.editor.GlyphMarginLane.Right,
                        },
                    },
                });
            }

            return decorations;
        });
    }, [gizmoScopeClass, gizmos, monacoInstance]);

    useEffect(() => {
        if (!editorInstance || !onGizmoClick) return;

        let longPressTimer: ReturnType<typeof setTimeout> | null = null;
        let pressedSelector: CodeGizmo | null = null;
        let shiftKey = false;
        const stopLongPress = () => {
            if (longPressTimer) clearTimeout(longPressTimer);
            longPressTimer = null;
        };
        const getTargetGizmo = (target: HTMLElement | null) => {
            if (!target) return null;

            const gizmoIndex = gizmos.findIndex((_gizmo, index) =>
                target.closest(`.${gizmoScopeClass}-click-${index}`));
            return gizmos[gizmoIndex] ?? null;
        };
        const getTargetFaviconGizmo = (target: HTMLElement | null) => {
            if (!target?.closest('.nop-code-gizmo-favicon')) return null;

            return getTargetGizmo(target);
        };
        const mouseDownDisposable = editorInstance.onMouseDown(event => {
            const target = event.target.element;
            const faviconGizmo = getTargetFaviconGizmo(target);
            if (faviconGizmo?.targetUrl) {
                window.open(faviconGizmo.targetUrl, '_blank', 'noopener,noreferrer');
                return;
            }

            const gizmo = getTargetGizmo(target);
            if (!gizmo) return;

            if (gizmo.kind === 'helper') {
                onGizmoClick(gizmo);
                return;
            }

            stopLongPress();
            pressedSelector = gizmo;
            shiftKey = event.event.shiftKey;
            longPressTimer = setTimeout(() => {
                const selector = pressedSelector;
                pressedSelector = null;
                longPressTimer = null;
                if (selector) onGizmoClick(selector, true);
            }, 550);
        });
        const mouseUpDisposable = editorInstance.onMouseUp(event => {
            const selector = pressedSelector;
            const releasedGizmo = getTargetGizmo(event.target.element);
            stopLongPress();
            pressedSelector = null;

            if (selector && releasedGizmo === selector) {
                onGizmoClick(selector, shiftKey || event.event.shiftKey);
            }
        });
        const mouseMoveDisposable = editorInstance.onMouseMove(event => {
            if (!pressedSelector || getTargetGizmo(event.target.element) === pressedSelector) return;

            stopLongPress();
            pressedSelector = null;
        });
        const mouseLeaveDisposable = editorInstance.onMouseLeave(() => {
            stopLongPress();
            pressedSelector = null;
        });

        return () => {
            stopLongPress();
            mouseDownDisposable.dispose();
            mouseUpDisposable.dispose();
            mouseMoveDisposable.dispose();
            mouseLeaveDisposable.dispose();
        };
    }, [editorInstance, gizmoScopeClass, gizmos, onGizmoClick]);

    useEffect(() => {
        const editorNode = editorInstance?.getDomNode();
        if (!editorNode || gizmos.length === 0) return;

        let cancelled = false;
        const style = document.createElement('style');

        Promise.all(gizmos.map(async (gizmo, index) => {
            const iconUrl = await getGizmoIconUrl(gizmo.icon, gizmo.color);
            return `
                .${gizmoScopeClass}-${index} {
                    --nop-code-gizmo-color: ${gizmo.color};
                    background-image: url("${iconUrl}") !important;
                }
                ${gizmo.faviconUrl ? `
                    .${gizmoScopeClass}-favicon-${index} {
                        background-image: url("${gizmo.faviconUrl}") !important;
                    }
                ` : ''}
            `;
        })).then(gizmoStyles => {
            if (cancelled) return;
            style.textContent = gizmoStyles.join('');
            document.head.appendChild(style);
        }).catch(() => {
            // Monaco keeps the colored gizmo shell visible if a local icon is missing.
        });

        return () => {
            cancelled = true;
            style.remove();
        };
    }, [editorInstance, gizmoScopeClass, gizmos]);

    return gizmoDecorations;
};
