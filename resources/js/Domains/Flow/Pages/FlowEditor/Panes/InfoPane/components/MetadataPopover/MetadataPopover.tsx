import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowRun } from '@/Domains/Flow/types';
import AnchoredPopoverPortal from '@/Domains/Flow/Pages/FlowEditor/components/AnchoredPopoverPortal/AnchoredPopoverPortal';
import { getRunMeta, renderInlineMarkdown } from '@/Domains/Flow/Pages/FlowEditor/utils/runDisplay';
import * as S from './styled';

interface MetadataPopoverProps {
    run: FlowRun;
    triggerRect: DOMRect | null;
    onClose: () => void;
}

export default function MetadataPopover({ run, triggerRect, onClose }: MetadataPopoverProps) {
    const metadata = getRunMeta(run);

    return (
        <AnchoredPopoverPortal
            open={Boolean(metadata)}
            triggerRect={triggerRect}
            position={rect => ({
                position: 'fixed',
                top: 'auto',
                bottom: window.innerHeight - rect.top + 6,
                left: rect.left + rect.width / 2,
            })}
            onClose={onClose}
        >
            {bindings => metadata && (
                <S.MetaPopover {...bindings}>
                    <S.MetaPopoverTitle>
                        <Icon icon="lucide:tag" width={12} height={12} />
                        Metadata
                    </S.MetaPopoverTitle>
                    <S.MetaPopoverBody>
                        {Object.entries(metadata).map(([key, value]) => (
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
