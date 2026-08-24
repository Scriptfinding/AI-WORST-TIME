import type React from 'react';

export interface UsageListRenderers<T> {
    renderLabel: (item: T) => React.ReactNode;
    renderIcon?: (item: T) => React.ReactNode;
    renderMeta?: (item: T) => React.ReactNode;
    renderTrailing?: (item: T) => React.ReactNode;
}

export interface UsageListProps<T> extends UsageListRenderers<T> {
    items: T[];
    getKey: (item: T) => React.Key;
    getHref?: (item: T) => string;
    variant?: 'card' | 'inline';
}

export type UsageListRendererProps<T> = Omit<UsageListProps<T>, 'variant'>;

export interface UsageRowProps<T> extends UsageListRenderers<T> {
    item: T;
    getHref?: (item: T) => string;
}
