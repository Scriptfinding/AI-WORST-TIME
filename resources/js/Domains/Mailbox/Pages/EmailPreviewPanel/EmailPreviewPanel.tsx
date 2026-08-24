import { useMemo, useState } from 'react';
import type { MailboxEmail } from '@/Domains/Mailbox/types';
import { Panel, PanelBody } from '@/Domains/Mailbox/Pages/shared.styled';
import EmailPreviewBody from './components/EmailPreviewBody/EmailPreviewBody';
import EmailPreviewHeader from './components/EmailPreviewHeader/EmailPreviewHeader';
import EmailSourceModal from './components/EmailSourceModal/EmailSourceModal';
import type { TesterMode } from './components/ExtractionTester/ExtractionTester';
import { buildEmailSource } from './utils';

interface Props {
    email: MailboxEmail;
    canDeleteEmails: boolean;
    onToggleRead: () => void;
    onDeleteEmail: () => void;
    onBack?: () => void;
}

export default function EmailPreviewPanel({ email, canDeleteEmails, onToggleRead, onDeleteEmail, onBack }: Props) {
    const [showSource, setShowSource] = useState(false);
    const [testerOpen, setTesterOpen] = useState(false);
    const [testerMode, setTesterMode] = useState<TesterMode>('regex');
    const [testerPattern, setTesterPattern] = useState('');

    const sourceCode = useMemo(() => buildEmailSource(email), [email]);

    return (
        <>
            <Panel>
                <EmailPreviewHeader
                    isRead={email.is_read}
                    canDeleteEmails={canDeleteEmails}
                    onToggleRead={onToggleRead}
                    onViewSource={() => setShowSource(true)}
                    onDeleteEmail={onDeleteEmail}
                    onBack={onBack}
                />
                <PanelBody>
                    <EmailPreviewBody email={email} />
                </PanelBody>
            </Panel>

            {showSource && (
                <EmailSourceModal
                    email={email}
                    sourceCode={sourceCode}
                    testerOpen={testerOpen}
                    testerMode={testerMode}
                    testerPattern={testerPattern}
                    onClose={() => setShowSource(false)}
                    onToggleTester={() => setTesterOpen(open => !open)}
                    onTesterModeChange={setTesterMode}
                    onTesterPatternChange={setTesterPattern}
                />
            )}
        </>
    );
}
