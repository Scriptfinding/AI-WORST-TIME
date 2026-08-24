import { forwardRef, type SVGProps } from 'react';
import { localIconNames } from './localIconNames';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'height' | 'width'> {
    icon: string;
    height?: number | string;
    width?: number | string;
}

const FALLBACK_ICON = 'lucide:circle-help';
const SPRITE_URL = '/icons/iconify/sprite.svg';

const resolveIcon = (icon: string) => localIconNames.has(icon) ? icon : FALLBACK_ICON;

export const getLocalIconUrl = (icon: string) => {
    const [prefix, name] = resolveIcon(icon).split(':');

    return `/icons/iconify/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`;
};

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({
    icon,
    height,
    width,
    ...props
}, ref) {
    const resolvedIcon = resolveIcon(icon);
    const symbolId = resolvedIcon.replace(':', '-');
    const resolvedWidth = width ?? '1em';
    const resolvedHeight = height ?? width ?? '1em';

    return (
        <svg
            {...props}
            ref={ref}
            width={resolvedWidth}
            height={resolvedHeight}
            focusable="false"
            aria-hidden={props['aria-hidden'] ?? (props['aria-label'] ? undefined : true)}
        >
            <use href={`${SPRITE_URL}#${symbolId}`} />
        </svg>
    );
});
