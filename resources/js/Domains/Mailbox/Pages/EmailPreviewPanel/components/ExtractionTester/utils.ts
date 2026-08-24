import type { MailboxEmail } from '@/Domains/Mailbox/types';

export type TesterMode = 'regex' | 'selector';

export interface ExtractionMatch {
    full: string;
    groups: string[];
}

export interface ExtractionResult {
    matches: ExtractionMatch[];
    error: string;
}

export function getMatches(
    email: MailboxEmail,
    sourceCode: string,
    mode: TesterMode,
    pattern: string,
): ExtractionResult {
    const empty: ExtractionResult = { matches: [], error: '' };
    if (!pattern.trim() || !sourceCode) return empty;

    if (mode === 'regex') {
        try {
            const regex = new RegExp(pattern, 'gs');
            const matches: ExtractionMatch[] = [];
            let match: RegExpExecArray | null;
            let safety = 0;

            while ((match = regex.exec(sourceCode)) !== null && safety++ < 200) {
                matches.push({ full: match[0], groups: match.slice(1) });
                if (!regex.global) break;
            }

            return { matches, error: '' };
        } catch (error) {
            return { matches: [], error: error instanceof Error ? error.message : 'Invalid regex' };
        }
    }

    try {
        const parser = new DOMParser();
        const htmlBody = email.html_body || email.text_body || '';
        const document = parser.parseFromString(htmlBody, 'text/html');
        const result = document.evaluate(pattern, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const matches: ExtractionMatch[] = [];

        for (let index = 0; index < result.snapshotLength && index < 200; index++) {
            const node = result.snapshotItem(index);
            if (!node) continue;

            const value = node.nodeType === Node.ATTRIBUTE_NODE
                ? (node as Attr).value
                : node.textContent || '';
            matches.push({ full: value, groups: [] });
        }

        return { matches, error: '' };
    } catch (error) {
        return { matches: [], error: error instanceof Error ? error.message : 'Invalid XPath expression' };
    }
}
