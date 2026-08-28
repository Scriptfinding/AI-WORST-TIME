import styled from 'styled-components';

export const Backdrop = styled.div`
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: ${({ theme }) => theme.colors.bg.primary}c7;
    backdrop-filter: blur(7px);
`;

export const Card = styled.section`
    position: relative;
    width: min(420px, calc(100vw - 40px));
    padding: 24px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 16px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
`;

export const Close = styled.button`
    position: absolute;
    top: 16px;
    right: 16px;
    display: grid;
    width: 30px;
    height: 30px;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: 9px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.primary};
    }
`;

export const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 36px 20px 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 650;
`;

export const BrandMark = styled.span`
    display: inline-flex;
    color: ${({ theme }) => theme.colors.brand};
`;

export const StoreBanners = styled.div`
    display: grid;
    gap: 8px;
    margin: 0 0 22px;
`;

export const StoreBanner = styled.a`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 10px;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.primary}70;
    font-size: 11px;
    text-decoration: none;
    transition: border-color 140ms ease, background 140ms ease;

    span {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 2px;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        font-weight: 600;
    }

    small {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 9px;
        font-weight: 500;
    }

    > svg {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:hover {
        border-color: ${({ theme }) => theme.colors.text.tertiary};
        background: ${({ theme }) => theme.colors.bg.primary};
    }
`;

export const Title = styled.h2`
    margin: 0;
    font-size: 22px;
    font-weight: 680;
    line-height: 1.2;
    letter-spacing: -0.025em;
`;

export const Intro = styled.p`
    margin: 8px 0 20px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.5;
`;

export const PickerHint = styled.div`
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 22px;
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.bg.primary}55;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;

    span {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        gap: 3px;
    }

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        font-weight: 600;
    }

    kbd {
        padding: 3px 6px;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        border-radius: 5px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        background: ${({ theme }) => theme.colors.bg.secondary};
        font-family: inherit;
        font-size: 9px;
    }
`;

export const HintIcon = styled.span`
    display: grid !important;
    width: 30px;
    height: 30px;
    flex: 0 0 auto !important;
    place-items: center;
    border-radius: 9px;
    color: ${({ theme }) => theme.colors.brand};
    background: ${({ theme }) => theme.colors.brand}14;
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
`;

export const DismissFuture = styled.button<{ $saved: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 0;
    border: 0;
    color: ${({ $saved, theme }) => (
        $saved ? theme.colors.brand : theme.colors.text.tertiary
    )};
    background: transparent;
    font-size: 11px;
    font-weight: 550;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
    }
`;

export const StartButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 15px;
    border: 0;
    border-radius: 10px;
    color: #fff;
    background: ${({ theme }) => theme.colors.brand};
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
    transition: transform 120ms ease, filter 120ms ease;

    &:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
    }
`;
