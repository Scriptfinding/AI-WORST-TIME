import { InlineItem, InlineItemMeta } from './InlineUsageRow.styled';
import { UsageItemName } from './sharedStyled';
import type { UsageRowProps } from './types';

export function InlineUsageRow<T>({
    item,
    renderIcon,
    renderLabel,
    renderMeta,
    renderTrailing,
}: UsageRowProps<T>) {
    return (
        <InlineItem>
            {renderIcon?.(item)}
            <UsageItemName>{renderLabel(item)}</UsageItemName>
            {renderMeta && <InlineItemMeta>{renderMeta(item)}</InlineItemMeta>}
            {renderTrailing?.(item)}
        </InlineItem>
    );
}
