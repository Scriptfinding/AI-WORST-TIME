import { Icon } from '@/Shared/UI/Icon/Icon';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { getNodeCategoryColor, getNodeIcon } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import * as S from './styled';

interface NodeConfigHeaderProps {
    entry: HelpEntryDef;
    label: string;
    currentSiteUrl: string | null;
    readOnly?: boolean;
    onLabelChange: (label: string) => void;
    onCommitLabel: () => void;
    onClose: () => void;
}

export default function NodeConfigHeader({
    entry,
    label,
    currentSiteUrl,
    readOnly,
    onLabelChange,
    onCommitLabel,
    onClose,
}: NodeConfigHeaderProps) {
    return (
        <>
            <S.Header>
                <S.Title>
                    <S.TitleIcon $color={getNodeCategoryColor(entry)}>
                        <Icon icon={getNodeIcon(entry)} width={24} height={24} />
                    </S.TitleIcon>
                    <div>
                        <S.TitleInput
                            value={label}
                            disabled={readOnly}
                            aria-label="Node name"
                            onChange={event => onLabelChange(event.target.value)}
                            onBlur={onCommitLabel}
                            onKeyDown={event => {
                                event.stopPropagation();
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    event.currentTarget.blur();
                                }
                            }}
                        />
                        <span>{entry.category}</span>
                    </div>
                </S.Title>
                <S.CloseButton type="button" onClick={onClose} title="Close">
                    <Icon icon="lucide:x" width={16} height={16} />
                </S.CloseButton>
            </S.Header>
            <S.CurrentSite
                as={currentSiteUrl ? 'a' : 'div'}
                href={currentSiteUrl ?? undefined}
                target={currentSiteUrl ? '_blank' : undefined}
                rel={currentSiteUrl ? 'noreferrer' : undefined}
                $available={Boolean(currentSiteUrl)}
            >
                <Icon icon={currentSiteUrl ? 'lucide:globe-2' : 'lucide:globe-lock'} width={14} height={14} />
                <span>Current page</span>
                <strong>{currentSiteUrl ?? 'No current page yet'}</strong>
                {currentSiteUrl && <Icon icon="lucide:external-link" width={13} height={13} />}
            </S.CurrentSite>
        </>
    );
}
