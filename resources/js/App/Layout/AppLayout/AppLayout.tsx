import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import Sidebar from '@/App/Layout/Sidebar/Sidebar';
import { useAuth, useFlash, usePageProps } from '@/App/Hooks/usePageProps';
import { useToast } from '@/App/Hooks/useToast';
import { PageOnboardingJumbo } from '@/App/Onboarding/PageOnboardingModal';
import { usePageTitle } from '@/App/Utils/documentTitle';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import * as S from './styled';

const EXPIRATION_WARNING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface AppLayoutProps {
    title?: React.ReactNode;
    headerRight?: React.ReactNode;
    noPadding?: boolean;
    children: React.ReactNode;
}

export default function AppLayout({ title, headerRight, noPadding, children }: AppLayoutProps) {
    const flash = useFlash();
    const { currentWorkspace, impersonating, safe_mode, run_quota } = usePageProps();
    const auth = useAuth();
    const { toast } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const shownRef = useRef<string | null>(null);
    const stringTitle = typeof title === 'string' ? title : null;
    const expirationDate = currentWorkspace?.expires_at
        ? new Date(currentWorkspace.expires_at)
        : null;
    const expirationTime = expirationDate?.getTime() ?? Number.NaN;
    const isWorkspaceExpired = Number.isFinite(expirationTime) && expirationTime <= Date.now();
    const showWorkspaceExpiration = Number.isFinite(expirationTime)
        && expirationTime - Date.now() <= EXPIRATION_WARNING_WINDOW_MS;

    usePageTitle(stringTitle, stringTitle !== null);

    useEffect(() => {
        const msg = flash?.success || flash?.error;
        if (!msg) return;
        const key = flash?.id ?? msg;
        if (key === shownRef.current) return;
        shownRef.current = key;
        toast(msg, flash?.success ? 'success' : 'error');
    }, [flash?.id, flash?.success, flash?.error, toast]);

    return (
        <S.Container>
            <S.SidebarOverlay $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />
            <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <S.Main>
                {safe_mode && (
                    <S.SafeModeBanner>
                        <Icon icon="lucide:triangle-alert" width={15} height={15} />
                        <span>
                            <strong>Safe mode is enabled.</strong> Authentication is bypassed until APP_SAFE_MODE is disabled.
                        </span>
                    </S.SafeModeBanner>
                )}
                {showWorkspaceExpiration && expirationDate && (
                    <S.WorkspaceExpirationBanner
                        $expired={isWorkspaceExpired}
                        role={isWorkspaceExpired ? 'alert' : 'status'}
                    >
                        <S.WorkspaceExpirationIcon $expired={isWorkspaceExpired}>
                            <Icon icon="lucide:calendar-clock" width={16} height={16} />
                        </S.WorkspaceExpirationIcon>
                        <S.WorkspaceExpirationMessage>
                            <strong>
                                {isWorkspaceExpired ? 'Workspace expired.' : 'Workspace expiration approaching.'}
                            </strong>{' '}
                            This workspace {isWorkspaceExpired ? 'expired' : 'expires'} on{' '}
                            {formatDateTime(expirationDate, {
                                dateStyle: 'long',
                                timeStyle: 'short',
                            })}.
                        </S.WorkspaceExpirationMessage>
                    </S.WorkspaceExpirationBanner>
                )}
                {run_quota?.exceeded && (
                    <S.RunQuotaBanner>
                        <Icon icon="lucide:gauge" width={15} height={15} />
                        <span>
                            <strong>Run quota reached.</strong> {run_quota.used}/{run_quota.limit} runs used this
                            cycle. Production runs are paused until {formatDateTime(run_quota.resets_at)}.
                        </span>
                    </S.RunQuotaBanner>
                )}
                {impersonating && (
                    <S.ImpersonateBanner>
                        <S.ImpersonateText>
                            <Icon icon="lucide:eye" width={14} height={14} />
                            Impersonating <strong>{auth.user?.name}</strong>
                        </S.ImpersonateText>
                        <S.ImpersonateLeave onClick={() => router.post('/leave-impersonate')}>
                            <Icon icon="lucide:log-out" width={13} height={13} />
                            Leave
                        </S.ImpersonateLeave>
                    </S.ImpersonateBanner>
                )}
                {title ? (
                    <S.Header>
                        <S.HeaderLeft>
                            <S.BurgerButton onClick={() => setSidebarOpen(true)}>
                                <Icon icon="lucide:menu" />
                            </S.BurgerButton>
                            <S.PageTitle>{title}</S.PageTitle>
                        </S.HeaderLeft>
                        {headerRight && <S.HeaderRight>{headerRight}</S.HeaderRight>}
                    </S.Header>
                ) : (
                    <S.MobileMenuBar>
                        <S.BurgerButton onClick={() => setSidebarOpen(true)}>
                            <Icon icon="lucide:menu" />
                        </S.BurgerButton>
                    </S.MobileMenuBar>
                )}
                <S.Content $noPadding={noPadding}>
                    <PageOnboardingJumbo inset={noPadding} />
                    {children}
                </S.Content>
            </S.Main>
        </S.Container>
    );
}
