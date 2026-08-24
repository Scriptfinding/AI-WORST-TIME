import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowRun } from '@/Domains/Flow/types';
import AnchoredPopoverPortal from '@/Domains/Flow/Pages/FlowEditor/components/AnchoredPopoverPortal/AnchoredPopoverPortal';
import { getRunMeta, renderInlineMarkdown } from '@/Domains/Flow/Pages/FlowEditor/utils/runDisplay';
import * as S from './RunMetadataPopover.styled';

interface Props {
    run: FlowRun | null;
    triggerRect: DOMRect | null;
    onClose: () => void;
}

export default function RunMetadataPopover({ run, triggerRect, onClose }: Props) {
    const meta = run ? getRunMeta(run) : null;

    return (
        <AnchoredPopoverPortal
            open={Boolean(meta)}
            triggerRect={triggerRect}
            position={rect => ({
                position: 'fixed',
                top: rect.bottom + 6,
                left: rect.left + rect.width / 2,
            })}
            onClose={onClose}
        >
            {bindings => meta && (
                <S.MetaPopover {...bindings}>
                    <S.MetaPopoverTitle>
                        <Icon icon="lucide:tag" width={12} height={12} />
                        Metadata
                    </S.MetaPopoverTitle>
                    <S.MetaPopoverBody>
                        {Object.entries(meta).map(([key, value]) => (
                            <S.MetaPopoverRow key={key}>
                                <S.MetaPopoverKey>{key}</S.MetaPopoverKey>
                                <S.MetaPopoverValue>
                                    {typeof value === 'object'
                                        ? JSON.stringify(value)
                                        : renderInlineMarkdown(String(value))}
                                </S.MetaPopoverValue>
                            </S.MetaPopoverRow>
                        ))}
                    </S.MetaPopoverBody>
                </S.MetaPopover>
            )}
        </AnchoredPopoverPortal>
    );
}
