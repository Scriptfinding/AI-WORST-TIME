import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import Modal from '@/Shared/UI/Modal/Modal';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import { ExpandBtn, FullEditorWrap, TopBar, Wrapper } from './styled';

interface Props {
    value: string;
    onChange?: (v: string) => void;
    readOnly?: boolean;
    title?: string;
    hideDefaultTrigger?: boolean;
    openRef?: React.MutableRefObject<(() => void) | null>;
    children: React.ReactNode;
}

export default function JsonExpandable({ value, onChange, readOnly, title, hideDefaultTrigger, openRef, children }: Props) {
    const [open, setOpen] = useState(false);
    const { resolved: resolvedTheme } = useThemeMode();
    const fullEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const isInternalChange = useRef(false);
    const isSyncing = useRef(false);

    const handleFullChange = useCallback((v: string | undefined) => {
        if (isSyncing.current) return;
        isInternalChange.current = true;
        onChange?.(v || '{}');
    }, [onChange]);

    useEffect(() => {
        if (!open) return;
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        const ed = fullEditorRef.current;
        if (ed && ed.getValue() !== value) {
            isSyncing.current = true;
            ed.setValue(value);
            isSyncing.current = false;
        }
    }, [value, open]);

    const handleFullMount: OnMount = (_editor) => {
        fullEditorRef.current = _editor;
    };

    useEffect(() => {
        if (!openRef) return;
        openRef.current = () => setOpen(true);
        return () => {
            openRef.current = null;
        };
    }, [openRef]);

    return (
        <Wrapper>
            {!hideDefaultTrigger && (
                <TopBar>
                    <ExpandBtn type="button" onClick={() => setOpen(true)} title="Open in fullscreen">
                        <Icon icon="lucide:external-link" width={12} height={12} />
                    </ExpandBtn>
                </TopBar>
            )}
            {children}
            {open && (
                <Modal isOpen onClose={() => setOpen(false)} title={title || 'JSON Editor'} fullScreen>
                    <FullEditorWrap>
                        <Editor
                            height="100%"
                            language="json"
                            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                            defaultValue={value}
                            onChange={handleFullChange}
                            onMount={handleFullMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'off',
                                padding: { top: 12 },
                                fixedOverflowWidgets: true,
                                quickSuggestions: { strings: true, other: true, comments: false },
                                wordBasedSuggestions: 'off',
                                suggest: {
                                    showFiles: false,
                                    showWords: false,
                                },
                                readOnly,
                            }}
                        />
                    </FullEditorWrap>
                </Modal>
            )}
        </Wrapper>
    );
}
