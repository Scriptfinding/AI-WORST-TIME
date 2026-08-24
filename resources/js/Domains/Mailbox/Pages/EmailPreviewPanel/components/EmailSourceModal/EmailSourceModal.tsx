import Editor from '@monaco-editor/react';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import type { MailboxEmail } from '@/Domains/Mailbox/types';
import Modal from '@/Shared/UI/Modal/Modal';
import ExtractionTester, { type TesterMode } from '@/Domains/Mailbox/Pages/EmailPreviewPanel/components/ExtractionTester/ExtractionTester';
import * as S from './styled';

interface Props {
    email: MailboxEmail;
    sourceCode: string;
    testerOpen: boolean;
    testerMode: TesterMode;
    testerPattern: string;
    onClose: () => void;
    onToggleTester: () => void;
    onTesterModeChange: (mode: TesterMode) => void;
    onTesterPatternChange: (pattern: string) => void;
}

export default function EmailSourceModal({
    email,
    sourceCode,
    testerOpen,
    testerMode,
    testerPattern,
    onClose,
    onToggleTester,
    onTesterModeChange,
    onTesterPatternChange,
}: Props) {
    const { resolved: resolvedTheme } = useThemeMode();

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={`Source - ${email.subject || '(No subject)'}`}
            fullScreen
        >
            <S.SourceLayout>
                <S.SourceEditor>
                    <Editor
                        language="html"
                        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                        value={sourceCode}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 12,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'off',
                            padding: { top: 8 },
                            wordBasedSuggestions: 'off',
                            suggest: {
                                showFiles: false,
                                showWords: false,
                            },
                        }}
                    />
                </S.SourceEditor>
                <ExtractionTester
                    email={email}
                    sourceCode={sourceCode}
                    isOpen={testerOpen}
                    mode={testerMode}
                    pattern={testerPattern}
                    onToggle={onToggleTester}
                    onModeChange={onTesterModeChange}
                    onPatternChange={onTesterPatternChange}
                />
            </S.SourceLayout>
        </Modal>
    );
}
