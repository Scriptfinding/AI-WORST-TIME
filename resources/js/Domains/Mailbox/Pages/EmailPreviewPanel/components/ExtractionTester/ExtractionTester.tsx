import { useMemo, type ChangeEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { MailboxEmail } from '@/Domains/Mailbox/types';
import * as S from './styled';
import { getMatches, type TesterMode } from './utils';

export type { TesterMode } from './utils';

interface Props {
    email: MailboxEmail;
    sourceCode: string;
    isOpen: boolean;
    mode: TesterMode;
    pattern: string;
    onToggle: () => void;
    onModeChange: (mode: TesterMode) => void;
    onPatternChange: (pattern: string) => void;
}

export default function ExtractionTester({
    email,
    sourceCode,
    isOpen,
    mode,
    pattern,
    onToggle,
    onModeChange,
    onPatternChange,
}: Props) {
    const results = useMemo(
        () => getMatches(email, sourceCode, mode, pattern),
        [email, mode, pattern, sourceCode],
    );

    return (
        <S.TesterBar>
            <S.TesterHeader>
                <S.TesterToggle type="button" onClick={onToggle}>
                    <Icon icon={isOpen ? 'lucide:chevron-down' : 'lucide:chevron-right'} width={12} />
                    <Icon icon="lucide:wrench" width={13} />
                    Extraction Tester
                </S.TesterToggle>
                {isOpen && (
                    <>
                        <S.TesterModeSelect
                            value={mode}
                            onChange={(event: ChangeEvent<HTMLSelectElement>) => onModeChange(event.target.value as TesterMode)}
                        >
                            <option value="regex">Regex</option>
                            <option value="selector">XPath</option>
                        </S.TesterModeSelect>
                        <S.TesterInput
                            value={pattern}
                            onChange={event => onPatternChange(event.target.value)}
                            placeholder={mode === 'regex'
                                ? 'e.g. <a[^>]*class="test"[^>]*href="([^"]*)"[^>]*>'
                                : 'e.g. //a[@class="test"]/@href or //a[contains(., \'Download Link\')]/@href'}
                            spellCheck={false}
                        />
                        {results.error && <S.TesterError>{results.error}</S.TesterError>}
                        {!results.error && pattern.trim() && (
                            <S.MatchCount>
                                {results.matches.length} match{results.matches.length !== 1 ? 'es' : ''}
                            </S.MatchCount>
                        )}
                    </>
                )}
            </S.TesterHeader>
            {isOpen && !results.error && pattern.trim() && (
                results.matches.length > 0 ? (
                    <S.TesterResults>
                        {results.matches.map((match, index) => (
                            <S.TesterMatch key={index}>
                                <S.MatchIndex>#{index}</S.MatchIndex>
                                {match.full}
                                {match.groups.map((group, groupIndex) => (
                                    <div key={groupIndex}>
                                        <S.GroupLabel>group {groupIndex + 1}:</S.GroupLabel>
                                        {group ?? '(undefined)'}
                                    </div>
                                ))}
                            </S.TesterMatch>
                        ))}
                    </S.TesterResults>
                ) : (
                    <S.EmptyResults>No matches found</S.EmptyResults>
                )
            )}
        </S.TesterBar>
    );
}
