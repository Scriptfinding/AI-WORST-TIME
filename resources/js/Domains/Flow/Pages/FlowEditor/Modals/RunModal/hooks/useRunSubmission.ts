import { useCallback, useEffect, useRef, useState } from 'react';

interface UseRunSubmissionOptions {
    isOpen: boolean;
    initialInput: string;
    rerunData?: string | null;
    onRun: (parsedInput: Record<string, unknown>, useOldCode: boolean) => void;
    onSaveInput: (parsedInput: Record<string, unknown>) => void;
}

function hasNonEmptyInput(raw: string): boolean {
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0;
    } catch {
        return raw.trim() !== '{}' && raw.trim() !== '';
    }
}

// Builds and submits manual run input from RunModal, including file uploads.
export function useRunSubmission({
    isOpen,
    initialInput,
    rerunData,
    onRun,
    onSaveInput,
}: UseRunSubmissionOptions) {
    const [input, setInput] = useState(initialInput);
    const [rerunInput, setRerunInput] = useState(rerunData || '{}');
    const [inputError, setInputError] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const onSaveInputRef = useRef(onSaveInput);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    onSaveInputRef.current = onSaveInput;

    const handleInputChange = useCallback((value: string | undefined) => {
        const nextInput = value || '{}';
        setInput(nextInput);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            try {
                onSaveInputRef.current(JSON.parse(nextInput));
            } catch {
                // Invalid JSON is reported when the run is submitted.
            }
        }, 600);
    }, []);

    const handleShowEditorChange = useCallback((visible: boolean) => {
        setShowEditor(visible);
        if (visible) return;

        setInput('{}');
        setInputError('');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        onSaveInputRef.current({});
    }, []);

    const handleRun = useCallback((useOldCode: boolean) => {
        const rawInput = rerunData ? rerunInput : (showEditor ? input : '{}');
        try {
            const parsedInput = JSON.parse(rawInput);
            setInputError('');
            onRun(parsedInput, useOldCode);
        } catch {
            setInputError('Invalid JSON');
        }
    }, [input, onRun, rerunData, rerunInput, showEditor]);

    useEffect(() => {
        if (!isOpen) return;

        setInput(initialInput);
        setRerunInput(rerunData || '{}');
        setInputError('');
        setShowEditor(hasNonEmptyInput(initialInput));
    }, [isOpen, initialInput, rerunData]);

    useEffect(() => () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    }, []);

    return {
        input,
        rerunInput,
        inputError,
        showEditor,
        handleInputChange,
        handleRun,
        handleShowEditorChange,
        setRerunInput,
    };
}
