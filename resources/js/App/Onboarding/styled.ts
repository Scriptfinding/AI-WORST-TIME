import styled from 'styled-components';
import type { OnboardingAccent, OnboardingLayout } from './pageOnboarding';

const ACCENTS: Record<OnboardingAccent, { main: string; soft: string; glow: string }> = {
    blue: { main: '#5b8cff', soft: '#5b8cff20', glow: '#5b8cff55' },
    cyan: { main: '#22d3c5', soft: '#22d3c520', glow: '#22d3c555' },
    amber: { main: '#f6b73c', soft: '#f6b73c20', glow: '#f6b73c55' },
    pink: { main: '#f472b6', soft: '#f472b620', glow: '#f472b655' },
    lime: { main: '#8acb45', soft: '#8acb4520', glow: '#8acb4555' },
    violet: { main: '#9b7cf8', soft: '#9b7cf820', glow: '#9b7cf855' },
};

export const Jumbo = styled.section<{ $accent: OnboardingAccent; $inset: boolean }>`
    --onboarding-accent: ${({ $accent }) => ACCENTS[$accent].main};
    --onboarding-soft: ${({ $accent }) => ACCENTS[$accent].soft};
    --onboarding-glow: ${({ $accent }) => ACCENTS[$accent].glow};
    position: relative;
    flex: 0 0 auto;
    margin: ${({ $inset }) => ($inset ? '24px 24px 20px' : '0 0 24px')};
    padding: 20px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--onboarding-accent) 28%, ${({ theme }) => theme.colors.border.default});
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
        linear-gradient(120deg, var(--onboarding-soft), transparent 46%),
        ${({ theme }) => theme.colors.bg.secondary};

    @media (max-width: 768px) {
        margin: ${({ $inset }) => ($inset ? '16px 16px 18px' : '0 0 18px')};
        padding: 16px;
    }
`;

export const CloseButton = styled.button`
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    border-radius: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: color 150ms ease, background 150ms ease, border-color 150ms ease;

    &:hover {
        border-color: ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.primary};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    &:focus-visible {
        outline: 2px solid var(--onboarding-accent);
        outline-offset: 2px;
    }
`;

export const Experience = styled.div<{ $layout: OnboardingLayout; $accent: OnboardingAccent }>`
    --onboarding-accent: ${({ $accent }) => ACCENTS[$accent].main};
    --onboarding-soft: ${({ $accent }) => ACCENTS[$accent].soft};
    --onboarding-glow: ${({ $accent }) => ACCENTS[$accent].glow};
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    grid-template-areas: "media copy";
    gap: 22px;
    align-items: stretch;
    min-width: 0;

    @media (max-width: 840px) {
        grid-template-columns: 132px minmax(0, 1fr);
        gap: 18px;
    }

    @media (max-width: 620px) {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-areas:
            "media"
            "copy";
    }
`;

export const Media = styled.div<{ $layout: OnboardingLayout }>`
    position: relative;
    grid-area: media;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--onboarding-accent) 32%, transparent);
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
        radial-gradient(circle at 28% 20%, var(--onboarding-glow), transparent 34%),
        radial-gradient(circle at 78% 80%, var(--onboarding-soft), transparent 38%),
        linear-gradient(145deg, ${({ theme }) => theme.colors.bg.primary}, ${({ theme }) => theme.colors.bg.secondary});
    isolation: isolate;

    @media (max-width: 620px) {
        min-height: 116px;
    }

    &::before {
        content: '';
        position: absolute;
        width: 180px;
        height: 180px;
        border: 1px solid color-mix(in srgb, var(--onboarding-accent) 28%, transparent);
        border-radius: ${({ $layout }) => {
            if ($layout === 'hero') return '38% 62% 46% 54% / 55% 42% 58% 45%';
            if ($layout === 'split') return '58% 42% 63% 37% / 44% 57% 43% 56%';
            if ($layout === 'cards') return '47% 53% 35% 65% / 61% 39% 56% 44%';
            if ($layout === 'timeline') return '64% 36% 52% 48% / 40% 60% 37% 63%';
            return '42% 58% 65% 35% / 38% 45% 55% 62%';
        }};
        animation: media-orbit 12s linear infinite;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 12px;
        border-radius: inherit;
        background-image: radial-gradient(var(--onboarding-accent) 0.8px, transparent 0.8px);
        background-size: 13px 13px;
        opacity: 0.18;
        z-index: -1;
    }

    @keyframes media-orbit {
        to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
        &::before { animation: none; }
    }
`;

export const MainIcon = styled.div`
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 78px;
    height: 78px;
    border: 1px solid color-mix(in srgb, var(--onboarding-accent) 40%, transparent);
    border-radius: 24px;
    background: color-mix(in srgb, ${({ theme }) => theme.colors.bg.secondary} 86%, var(--onboarding-accent));
    color: var(--onboarding-accent);
    box-shadow: 0 18px 50px var(--onboarding-soft);
    transform: rotate(-5deg);
    animation: icon-arrive 500ms cubic-bezier(.2, .9, .3, 1.2) both;

    @keyframes icon-arrive {
        from { opacity: 0; transform: translateY(12px) rotate(-12deg) scale(.82); }
        to { opacity: 1; transform: translateY(0) rotate(-5deg) scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

export const Satellite = styled.div<{ $position: 'top' | 'bottom' }>`
    position: absolute;
    z-index: 3;
    ${({ $position }) => ($position === 'top' ? 'top: 22px; right: 24px;' : 'bottom: 20px; left: 24px;')}
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 13px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: var(--onboarding-accent);
    box-shadow: ${({ theme }) => theme.shadow.md};
`;

export const BrandIcons = styled.div`
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
`;

export const BrandIcon = styled.span`
    --brand-rotation: 0deg;
    --brand-scale: 1;
    position: absolute;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 10px;
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.md};
    animation: brand-float 3.6s ease-in-out infinite;

    &:nth-child(1) {
        --brand-rotation: -14deg;
        --brand-scale: .86;
        top: 17%;
        left: 16%;
    }

    &:nth-child(2) {
        --brand-rotation: 11deg;
        --brand-scale: 1.18;
        top: 34%;
        right: 14%;
        animation-delay: -1.2s;
    }

    &:nth-child(3) {
        --brand-rotation: -7deg;
        --brand-scale: .74;
        bottom: 10%;
        left: 31%;
        animation-delay: -2.4s;
    }

    @keyframes brand-float {
        0%, 100% {
            transform: translateY(0) rotate(var(--brand-rotation)) scale(var(--brand-scale));
        }
        50% {
            transform: translateY(-7px) rotate(var(--brand-rotation)) scale(var(--brand-scale));
        }
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
        transform: rotate(var(--brand-rotation)) scale(var(--brand-scale));
    }
`;

export const Confetti = styled.i<{ $index: number }>`
    position: absolute;
    top: ${({ $index }) => 18 + (($index * 29) % 70)}%;
    left: ${({ $index }) => 8 + (($index * 37) % 84)}%;
    width: ${({ $index }) => ($index % 2 === 0 ? '5px' : '8px')};
    height: ${({ $index }) => ($index % 3 === 0 ? '12px' : '5px')};
    border-radius: 999px;
    background: ${({ $index }) => ($index % 2 === 0 ? 'var(--onboarding-accent)' : 'currentColor')};
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.48;
    transform: rotate(${({ $index }) => $index * 31}deg);
`;

export const Copy = styled.div`
    grid-area: copy;
    min-width: 0;
    padding: 2px 42px 2px 0;

    @media (max-width: 620px) {
        padding: 0;
    }
`;

export const Title = styled.h2`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -.025em;
    line-height: 1.25;
`;

export const MarketingLine = styled.p`
    margin: 4px 0 12px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 600;
    line-height: 1.45;
`;

export const Intro = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 14px;
    line-height: 1.6;
`;

export const Highlights = styled.ol`
    display: grid;
    grid-template-columns: 1fr;
    gap: 9px;
    margin: 14px 0;
    padding: 0;
    list-style: none;
`;

export const Highlight = styled.li`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 2px 0;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    line-height: 1.5;

    > span:first-child {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 20px;
        height: 20px;
        border-radius: 7px;
        background: var(--onboarding-soft);
        color: var(--onboarding-accent);
        font-size: 10px;
        font-weight: 700;
    }

    > svg {
        flex: 0 0 auto;
        margin-top: 2px;
        color: var(--onboarding-accent);
    }
`;

export const NextStep = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 154px 12px 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: linear-gradient(90deg, var(--onboarding-soft), transparent 70%);
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.5;

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    @media (max-width: 720px) {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
        padding-right: 14px;
    }
`;

export const DisableButton = styled.button`
    position: absolute;
    right: 12px;
    bottom: 12px;
    padding: 3px 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    transition: color 150ms ease, text-decoration-color 150ms ease;

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
        text-decoration-color: currentColor;
    }

`;
