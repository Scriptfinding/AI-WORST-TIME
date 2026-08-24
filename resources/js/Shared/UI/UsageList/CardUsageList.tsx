import { CardList } from './CardUsageList.styled';
import { CardUsageRow } from './CardUsageRow';
import type { UsageListRendererProps } from './types';

export function CardUsageList<T>({
    items,
    getKey,
    getHref,
    renderIcon,
    renderLabel,
    renderMeta,
    renderTrailing,
}: UsageListRendererProps<T>) {
    return (
        <CardList>
            {items.map(item => (
                <CardUsageRow
                    key={getKey(item)}
                    item={item}
                    getHref={getHref}
                    renderIcon={renderIcon}
                    renderLabel={renderLabel}
                    renderMeta={renderMeta}
                    renderTrailing={renderTrailing}
                />
            ))}
        </CardList>
    );
}
