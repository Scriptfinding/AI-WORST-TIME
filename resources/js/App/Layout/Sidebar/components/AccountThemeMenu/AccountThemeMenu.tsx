import { useRef, useState, type MouseEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import type { User } from '@/App/types';
import { useDismissOnPointerDownOutside } from '@/App/Layout/Sidebar/hooks/useDismissOnPointerDownOutside';
import { THEME_OPTIONS } from '@/App/Layout/Sidebar/utils/themeOptions';
import * as S from './styled';

interface AccountThemeMenuProps {
    user: User;
    collapsed: boolean;
    onNavigate: (event: MouseEvent, url: string) => void;
    onClose?: () => void;
}

export default function AccountThemeMenu({
    user,
    collapsed,
    onNavigate,
    onClose,
}: AccountThemeMenuProps) {
    const [open, setOpen] = useState(false);
    const rowRef = useRef<HTMLDivElement>(null);
    const { mode, setMode } = useThemeMode();
    const userIconData = {
        icon_type: user.icon_type,
        icon_value: user.icon_value,
        icon_color: user.icon_color,
        icon_url: user.icon_url,
        name: user.name,
    };

    useDismissOnPointerDownOutside(rowRef, open, () => setOpen(false));

    return (
        <S.Footer $collapsed={collapsed}>
            <S.Row ref={rowRef} $collapsed={collapsed}>
                <S.ProfileSummary
                    href="/profile"
                    $collapsed={collapsed}
                    onClick={event => onNavigate(event, '/profile')}
                    title="Open profile"
                >
                    <FlowIcon flow={userIconData} size={28} radius="full" />
                    {!collapsed && (
                        <S.UserDetails>
                            <S.UserName>{user.name}</S.UserName>
                            <S.UserRole>{user.workspace_role}</S.UserRole>
                        </S.UserDetails>
                    )}
                </S.ProfileSummary>
                <S.CogButton
                    $active={open}
                    onClick={() => setOpen(previous => !previous)}
                    title="Account menu"
                    aria-label="Open account menu"
                >
                    <Icon icon="lucide:settings" />
                </S.CogButton>

                {open && (
                    <S.Menu $collapsed={collapsed}>
                        <S.MenuItem
                            as="a"
                            href="/profile"
                            onClick={event => {
                                setOpen(false);
                                onNavigate(event, '/profile');
                            }}
                        >
                            <Icon icon="lucide:user-round" />
                            Profile
                        </S.MenuItem>

                        <S.Divider />

                        {THEME_OPTIONS.map(option => (
                            <S.MenuItem
                                key={option.value}
                                onClick={() => {
                                    setMode(option.value);
                                    setOpen(false);
                                }}
                            >
                                <Icon icon={option.icon} />
                                {option.label} mode
                                {mode === option.value && (
                                    <S.Check>
                                        <Icon icon="lucide:check" />
                                    </S.Check>
                                )}
                            </S.MenuItem>
                        ))}

                        <S.Divider />

                        <S.MenuItem
                            $danger
                            onClick={() => {
                                setOpen(false);
                                onClose?.();
                                router.post('/logout');
                            }}
                        >
                            <Icon icon="lucide:log-out" />
                            Log out
                        </S.MenuItem>
                    </S.Menu>
                )}
            </S.Row>
        </S.Footer>
    );
}
