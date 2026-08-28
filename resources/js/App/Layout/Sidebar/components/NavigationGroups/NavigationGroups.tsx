import type { MouseEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { AppSettings } from '@/App/types';
import * as S from './styled';

interface NavigationGroupsProps {
    settings: AppSettings;
    currentPath: string;
    collapsed: boolean;
    isAdmin: boolean;
    onNavigate: (event: MouseEvent, url: string) => void;
}

interface NavigationItem {
    label: string;
    icon: string;
    url: string;
    active: boolean;
    visible?: boolean;
}

export default function NavigationGroups({
    settings,
    currentPath,
    collapsed,
    isAdmin,
    onNavigate,
}: NavigationGroupsProps) {
    const isRunsPath = currentPath.startsWith('/flows/runs');
    const promoteDisabledFeatures = settings.promote_disabled_features;
    const groups: { title?: string; items: NavigationItem[]; visible?: boolean }[] = [
        {
            items: [
                { label: 'Dashboard', icon: 'lucide:home', url: '/', active: currentPath === '/' },
                {
                    label: 'Flow Explorer',
                    icon: 'lucide:layout-grid',
                    url: '/flows',
                    active: currentPath.startsWith('/flows') && !isRunsPath,
                },
                { label: 'Runs', icon: 'lucide:activity', url: '/flows/runs', active: isRunsPath },
            ],
        },
        {
            title: 'Tools',
            items: [
                {
                    label: 'Variables',
                    icon: 'lucide:braces',
                    url: '/variables',
                    active: currentPath.startsWith('/variables'),
                    visible: settings.variables_enabled || promoteDisabledFeatures,
                },
                {
                    label: 'Channels',
                    icon: 'lucide:bell',
                    url: '/channels',
                    active: currentPath.startsWith('/channels'),
                    visible: settings.messenger_enabled || promoteDisabledFeatures,
                },
                {
                    label: 'Mailboxes',
                    icon: 'lucide:mail',
                    url: '/mailboxes',
                    active: currentPath.startsWith('/mailboxes'),
                    visible: settings.mailbox_enabled || promoteDisabledFeatures,
                },
                {
                    label: 'Snippets',
                    icon: 'lucide:box',
                    url: '/snippets',
                    active: currentPath.startsWith('/snippets'),
                    visible: settings.snippets_enabled || promoteDisabledFeatures,
                },
                {
                    label: 'Data Tables',
                    icon: 'lucide:database',
                    url: '/data-tables',
                    active: currentPath.startsWith('/data-tables'),
                },
                {
                    label: 'AI Models',
                    icon: 'lucide:sparkles',
                    url: '/ai-models',
                    active: currentPath.startsWith('/ai-models'),
                    visible: settings.ai_enabled || promoteDisabledFeatures,
                },
            ],
        },
        {
            title: 'Workspace',
            items: [
                {
                    label: 'Settings',
                    icon: 'lucide:settings',
                    url: '/workspace/settings',
                    active: currentPath === '/workspace/settings',
                },
                {
                    label: 'Members',
                    icon: 'lucide:users',
                    url: '/workspace/members',
                    active: currentPath === '/workspace/members',
                },
                {
                    label: 'Integrations',
                    icon: 'lucide:puzzle',
                    url: '/integrations',
                    active: currentPath.startsWith('/integrations'),
                },
            ],
        },
        {
            title: 'Admin',
            visible: isAdmin,
            items: [
                {
                    label: 'Users',
                    icon: 'lucide:users',
                    url: '/admin/users',
                    active: currentPath.startsWith('/admin/users'),
                },
                {
                    label: 'Workspaces',
                    icon: 'lucide:building-2',
                    url: '/admin/workspaces',
                    active: currentPath.startsWith('/admin/workspaces'),
                },
                {
                    label: 'Server',
                    icon: 'lucide:server',
                    url: '/admin/server',
                    active: currentPath.startsWith('/admin/server'),
                },
            ],
        },
    ];

    return (
        <S.Nav>
            {groups.map(group =>
                group.visible === false ? null : (
                    <S.Section key={group.title ?? 'main'}>
                        {group.title && <S.SectionTitle $collapsed={collapsed}>{group.title}</S.SectionTitle>}
                        {group.items.map(item =>
                            item.visible === false ? null : (
                                <S.Item
                                    key={item.url}
                                    href={item.url}
                                    $active={item.active}
                                    $collapsed={collapsed}
                                    onClick={event => onNavigate(event, item.url)}
                                    title={item.label}
                                >
                                    <Icon icon={item.icon} />
                                    <S.ItemLabel $collapsed={collapsed}>{item.label}</S.ItemLabel>
                                </S.Item>
                            ),
                        )}
                    </S.Section>
                ),
            )}
        </S.Nav>
    );
}
