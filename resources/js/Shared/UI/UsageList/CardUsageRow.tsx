import { CardItem, CardItemLabel } from './CardUsageRow.styled';
import { UsageItemName } from './sharedStyled';
import type { UsageRowProps } from './types';

export function CardUsageRow<T>({
    item,
    getHref,
    renderIcon,
    renderLabel,
    renderMeta,
    renderTrailing,
}: UsageRowProps<T>) {
    return (
        <CardItem
            href={getHref?.(item)}
            target={getHref ? '_blank' : undefined}
            rel={getHref ? 'noopener noreferrer' : undefined}
        >
            <CardItemLabel>
                {renderIcon?.(item)}
                <UsageItemName>{renderLabel(item)}</UsageItemName>
            </CardItemLabel>
            {renderMeta?.(item)}
            {renderTrailing?.(item)}
        </CardItem>
    );
}
