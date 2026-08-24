import type { Flow } from '@/Domains/Flow/types';

export type SiblingFlow = Pick<
    Flow,
    'id' | 'name' | 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url' | 'library_reference'
>;
