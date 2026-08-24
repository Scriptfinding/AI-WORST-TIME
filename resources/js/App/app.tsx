import './bootstrap';
import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeModeProvider } from './Hooks/useThemeMode';
import { ToastProvider } from './Hooks/useToast';
import PageOnboardingModal from './Onboarding/PageOnboardingModal';
import { getAppPageBranding, syncAppPage } from './Utils/appPage';
import { GlobalStyles } from './Utils/globalStyles';
import { GrabberProvider } from '@/Domains/Flow/Pages/FlowEditor/Grabber/GrabberContext';

const domainPages = import.meta.glob('../Domains/**/Pages/**/*.tsx', { eager: true });
const appPages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
const proprietaryPages = import.meta.glob(
    '../../../proprietary/resources/js/Domains/**/Pages/**/*.pp.tsx',
    { eager: true }
);

const PAGE_DOMAINS: Record<string, string> = {
    Admin: 'Admin',
    AiModels: 'AiModel',
    Auth: 'Auth',
    Channels: 'NotificationChannel',
    Flow: 'Flow',
    Integrations: 'Integration',
    License: 'Licensing',
    Mailbox: 'Mailbox',
    Profile: 'Profile',
    Snippet: 'Snippet',
    Variables: 'Variable',
    Workspace: 'Workspace',
};

function resolvePage(name: string) {
    const [logicalDomain, ...pageParts] = name.split('/');
    const pagePath = pageParts.join('/');

    if (logicalDomain === 'Dashboard') {
        return appPages[`./Pages/${pagePath}.tsx`];
    }

    const domain = PAGE_DOMAINS[logicalDomain];
    if (!domain) return undefined;

    return domainPages[`../Domains/${domain}/Pages/${pagePath}.tsx`]
        ?? proprietaryPages[
            `../../../proprietary/resources/js/Domains/${domain}/Pages/${pagePath}.pp.tsx`
        ];
}

if (import.meta.env.DEV) {
    import('react-grab');
}

function getGrabberStoreUrl(props: Record<string, unknown>): string {
    const settings = props.settings;
    if (!settings || typeof settings !== 'object' || !('grabber_store_url' in settings)) {
        return '';
    }

    return typeof settings.grabber_store_url === 'string' ? settings.grabber_store_url : '';
}

router.on('navigate', (event) => {
    syncAppPage(event.detail.page);
});

router.on('invalid', (event) => {
    if (event.detail.response.status === 419) {
        event.preventDefault();
        window.location.reload();
    }
});

createInertiaApp({
    resolve: resolvePage,
    setup({ el, App, props }) {
        syncAppPage(props.initialPage);
        const branding = getAppPageBranding(props.initialPage.props);
        const grabberStoreUrl = getGrabberStoreUrl(props.initialPage.props);

        createRoot(el).render(
            <ThemeModeProvider initialAccentColor={branding?.accentColor}>
                <GlobalStyles />
                <ToastProvider>
                    <GrabberProvider storeUrl={grabberStoreUrl}>
                        <PageOnboardingModal initialPage={props.initialPage}>
                            <App {...props} />
                        </PageOnboardingModal>
                    </GrabberProvider>
                </ToastProvider>
            </ThemeModeProvider>
        );
    },
});
