import { CardUsageList } from './CardUsageList';
import { InlineUsageList } from './InlineUsageList';
import type { UsageListProps } from './types';

export { UsageBadge } from './styled';
export { UsageBadgeHint } from './UsageBadgeHint';
export { UsageMessage } from './UsageMessage';

export function UsageList<T>({
    items,
    getKey,
    renderLabel,
    renderIcon,
    renderMeta,
    renderTrailing,
    getHref,
    variant = 'card',
}: UsageListProps<T>) {
    if (variant === 'inline') {
        return <InlineUsageList
            items={items}
            getKey={getKey}
            getHref={getHref}
            renderLabel={renderLabel}
            renderIcon={renderIcon}
            renderMeta={renderMeta}
            renderTrailing={renderTrailing}
        />;
    }

    return <CardUsageList
        items={items}
        getKey={getKey}
        getHref={getHref}
        renderLabel={renderLabel}
        renderIcon={renderIcon}
        renderMeta={renderMeta}
        renderTrailing={renderTrailing}
    />;
}
