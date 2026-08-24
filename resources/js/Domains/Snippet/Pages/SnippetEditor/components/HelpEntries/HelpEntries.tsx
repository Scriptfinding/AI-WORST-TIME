import { Icon } from '@/Shared/UI/Icon/Icon';
import { EvalButton } from '@/Shared/CodeEditor/shared/evaluation-modal.styled';
import {
    HelpDesc,
    HelpEntry,
    HelpEntryContent,
    HelpEntryEditLink,
    HelpEntryIcon,
    HelpEntryRow,
    HelpEntryTop,
    HelpOptions,
    HelpSignature,
    HelpSignatureRow,
} from '@/Shared/CodeEditor/shared/help-entries.styled';
import {
    HelpEmptySearch,
    HelpPanelContent,
} from '@/Shared/CodeEditor/shared/help-toolbox.styled';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { formatHelpEntryLabel, getHelpCategoryColor, getHelpIcon } from '@/Domains/Flow/Pages/FlowEditor/utils/helpToolbox';

interface HelpEntriesProps {
    entries: HelpEntryDef[];
    activeIndex: number;
    entryRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
    onActiveIndexChange: (index: number) => void;
    onInsert: (entry: HelpEntryDef) => void;
    onEvaluate: (entry: HelpEntryDef) => void;
}

export function HelpEntries({
    entries,
    activeIndex,
    entryRefs,
    onActiveIndexChange,
    onInsert,
    onEvaluate,
}: HelpEntriesProps) {
    if (entries.length === 0) {
        return (
            <HelpPanelContent>
                <HelpEmptySearch>No matching functions.</HelpEmptySearch>
            </HelpPanelContent>
        );
    }

    return (
        <HelpPanelContent>
            {entries.map((entry, index) => {
                const entryColor = getHelpCategoryColor(entry);

                return (
                    <HelpEntryRow
                        key={`${entry.category}:${entry.name}`}
                        onMouseEnter={() => onActiveIndexChange(index)}
                    >
                        <HelpEntry
                            ref={element => {
                                entryRefs.current[index] = element;
                            }}
                            type="button"
                            $active={activeIndex === index}
                            $color={entryColor}
                            $hasEditAction={Boolean(entry.editUrl)}
                            onClick={() => onInsert(entry)}
                        >
                            <HelpEntryIcon $color={entryColor}>
                                <Icon icon={getHelpIcon(entry)} width={14} height={14} />
                            </HelpEntryIcon>
                            <HelpEntryContent>
                                <HelpEntryTop>
                                    <strong>{formatHelpEntryLabel(entry)}</strong>
                                    <small>{entry.category}</small>
                                </HelpEntryTop>
                                <HelpSignatureRow>
                                    <HelpSignature>{entry.signature}</HelpSignature>
                                    {entry.evalExpr && (
                                        <EvalButton
                                            onClick={event => {
                                                event.stopPropagation();
                                                onEvaluate(entry);
                                            }}
                                            title="Run example"
                                        >
                                            <Icon icon="lucide:play" />
                                        </EvalButton>
                                    )}
                                </HelpSignatureRow>
                                {entry.desc && <HelpDesc>{entry.desc}</HelpDesc>}
                                {entry.options && <HelpOptions>{entry.options}</HelpOptions>}
                            </HelpEntryContent>
                        </HelpEntry>
                        {entry.editUrl && (
                            <HelpEntryEditLink
                                href={entry.editUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Open ${formatHelpEntryLabel(entry)} snippet`}
                                aria-label={`Open ${formatHelpEntryLabel(entry)} snippet editor`}
                            >
                                <Icon icon="lucide:square-pen" width={13} height={13} />
                            </HelpEntryEditLink>
                        )}
                    </HelpEntryRow>
                );
            })}
        </HelpPanelContent>
    );
}
