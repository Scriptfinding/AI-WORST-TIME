import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import axios from 'axios';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import type { Id } from '@/Shared/types';
import { findPageOnboarding, ONBOARDING_RESET_EVENT } from './pageOnboarding';
import * as S from './styled';

const ONBOARDING_DISABLED_KEY = 'onboarding.disabled';

interface OnboardingUser {
    id: Id;
    onboarding_versions?: Record<string, number>;
}

interface OnboardingPage {
    url: string;
    props: {
        auth?: {
            user?: OnboardingUser | null;
        };
    };
}

interface PageOnboardingProps {
    initialPage: unknown;
    children: React.ReactNode;
}

function pageUser(page: OnboardingPage): OnboardingUser | null {
    return page.props.auth?.user ?? null;
}

function mergeVersions(
    serverVersions: Record<string, number>,
    localVersions: Record<string, number>,
): Record<string, number> {
    const merged = { ...serverVersions };

    Object.entries(localVersions).forEach(([key, version]) => {
        merged[key] = Math.max(merged[key] ?? 0, version);
    });

    return merged;
}

export default function PageOnboardingModal({ initialPage, children }: PageOnboardingProps) {
    const page = initialPage as OnboardingPage;
    const initialUser = pageUser(page);
    const userId = useRef<Id | null>(initialUser?.id ?? null);
    const [url, setUrl] = useState(page.url);
    const [versions, setVersions] = useState<Record<string, number>>(
        initialUser?.onboarding_versions ?? {},
    );
    const definition = useMemo(() => findPageOnboarding(url), [url]);
    const onboardingDisabled = (versions[ONBOARDING_DISABLED_KEY] ?? 0) >= 1;
    const isOpen = Boolean(
        definition
        && !onboardingDisabled
        && (versions[definition.key] ?? 0) < definition.version,
    );

    useEffect(() => {
        const removeNavigateListener = router.on('navigate', event => {
            const page = event.detail.page as unknown as OnboardingPage;
            const user = pageUser(page);
            const nextUserId = user?.id ?? null;
            const serverVersions = user?.onboarding_versions ?? {};

            setUrl(page.url);
            if (nextUserId !== userId.current) {
                userId.current = nextUserId;
                setVersions(serverVersions);
                return;
            }

            setVersions(current => mergeVersions(serverVersions, current));
        });

        const resetOnboarding = () => setVersions({});
        window.addEventListener(ONBOARDING_RESET_EVENT, resetOnboarding);

        return () => {
            removeNavigateListener();
            window.removeEventListener(ONBOARDING_RESET_EVENT, resetOnboarding);
        };
    }, []);

    const complete = () => {
        if (!definition) return;

        setVersions(current => ({
            ...current,
            [definition.key]: definition.version,
        }));

        void axios
            .patch('/profile/onboarding', {
                key: definition.key,
                version: definition.version,
            })
            .catch(() => undefined);
    };

    const disableAll = () => {
        setVersions(current => ({
            ...current,
            [ONBOARDING_DISABLED_KEY]: 1,
        }));

        void axios
            .patch('/profile/onboarding', {
                key: ONBOARDING_DISABLED_KEY,
                version: 1,
            })
            .catch(() => undefined);
    };

    return (
        <>
            {children}
            {definition && (
                <Modal
                    isOpen={isOpen}
                    onClose={complete}
                    title={definition.title}
                    caption="A quick tour of this space"
                    width={definition.layout === 'split' || definition.layout === 'poster' ? '760px' : '640px'}
                    footer={(
                        <S.Footer>
                            <S.DisableButton type="button" onClick={disableAll}>
                                Don't show these messages
                            </S.DisableButton>
                            <Button onClick={complete}>Let's go</Button>
                        </S.Footer>
                    )}
                >
                    <S.Experience $layout={definition.layout} $accent={definition.accent}>
                        <S.Media $layout={definition.layout} aria-hidden="true">
                            {Array.from({ length: 8 }, (_, index) => (
                                <S.Confetti key={index} $index={index} />
                            ))}
                            <S.Satellite $position="top">
                                <Icon icon={definition.mediaIcons[0]} width={18} height={18} />
                            </S.Satellite>
                            <S.MainIcon>
                                <Icon icon={definition.icon} width={40} height={40} />
                            </S.MainIcon>
                            {definition.brandIcons && (
                                <S.BrandIcons>
                                    {definition.brandIcons.map(brandIcon => (
                                        <S.BrandIcon key={brandIcon}>
                                            <Icon icon={brandIcon} width={21} height={21} />
                                        </S.BrandIcon>
                                    ))}
                                </S.BrandIcons>
                            )}
                            <S.Satellite $position="bottom">
                                <Icon icon={definition.mediaIcons[1]} width={18} height={18} />
                            </S.Satellite>
                        </S.Media>
                        <S.Copy>
                            <S.MarketingLine>{definition.marketingLine}</S.MarketingLine>
                            <S.Intro>{definition.description}</S.Intro>
                            <S.Highlights $layout={definition.layout}>
                                {definition.highlights.map((highlight, index) => (
                                    <S.Highlight key={highlight} $layout={definition.layout}>
                                        {definition.layout === 'timeline' ? (
                                            <span>{index + 1}</span>
                                        ) : (
                                            <Icon icon="lucide:circle-check" width={16} height={16} />
                                        )}
                                        <span>{highlight}</span>
                                    </S.Highlight>
                                ))}
                            </S.Highlights>
                            <S.NextStep>
                                <strong>Start here:</strong> {definition.nextStep}
                            </S.NextStep>
                        </S.Copy>
                    </S.Experience>
                </Modal>
            )}
        </>
    );
}
