import { InlineUsageRow } from './InlineUsageRow';
import type { UsageListRendererProps } from './types';

export function InlineUsageList<T>({
    items,
    getKey,
    renderIcon,
    renderLabel,
    renderMeta,
    renderTrailing,
}: UsageListRendererProps<T>) {
    return (
        <>
            {items.map(item => (
                <InlineUsageRow
                    key={getKey(item)}
                    item={item}
                    renderIcon={renderIcon}
                    renderLabel={renderLabel}
                    renderMeta={renderMeta}
                    renderTrailing={renderTrailing}
                />
            ))}
        </>
    );
}
