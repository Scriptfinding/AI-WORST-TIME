import {
    useRef,
    useState,
    type ChangeEvent,
    type ClipboardEvent,
    type KeyboardEvent,
} from 'react';
import * as S from './styled';

type DeleteBehavior = 'clear-current' | 'clear-tail';

interface UseOtpInputOptions {
    deleteBehavior?: DeleteBehavior;
    length?: number;
}

export interface OtpInputController {
    code: string;
    digits: string[];
    focus: (index?: number) => void;
    reset: () => void;
    setInputRef: (index: number, input: HTMLInputElement | null) => void;
    onChange: (index: number, event: ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void;
    onPaste: (index: number, value: string) => void;
}

interface OtpInputProps {
    controller: OtpInputController;
    disabled?: boolean;
    label?: string;
}

// Coordinates OTP digits, focus movement, deletion, and pasted codes across separate inputs.
export function useOtpInput({
    deleteBehavior = 'clear-tail',
    length = 6,
}: UseOtpInputOptions = {}): OtpInputController {
    const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''));
    const inputs = useRef<Array<HTMLInputElement | null>>([]);

    const focus = (index = 0) => {
        inputs.current[index]?.focus();
    };

    const reset = () => {
        setDigits(Array(length).fill(''));
    };

    const applyDigits = (startIndex: number, value: string) => {
        const incoming = value.replace(/\D/g, '').slice(0, length - startIndex);
        if (!incoming) return;

        setDigits(current => {
            const next = [...current];
            incoming.split('').forEach((digit, offset) => {
                next[startIndex + offset] = digit;
            });
            return next;
        });
        focus(Math.min(startIndex + incoming.length, length - 1));
    };

    const onChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value.length > 1) {
            applyDigits(index, value);
            return;
        }

        const digit = value.replace(/\D/g, '');
        setDigits(current => current.map((item, itemIndex) => itemIndex === index ? digit : item));
        if (digit && index < length - 1) focus(index + 1);
    };

    const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace') {
            event.preventDefault();
            setDigits(current => {
                const next = [...current];
                if (next[index]) {
                    next[index] = '';
                } else if (index > 0) {
                    next[index - 1] = '';
                    focus(index - 1);
                }
                return next;
            });
        } else if (event.key === 'Delete') {
            event.preventDefault();
            setDigits(current => current.map((digit, digitIndex) => (
                deleteBehavior === 'clear-tail' && digitIndex >= index
                    ? ''
                    : digitIndex === index
                        ? ''
                        : digit
            )));
        } else if (event.key === 'ArrowLeft' && index > 0) {
            focus(index - 1);
        } else if (event.key === 'ArrowRight' && index < length - 1) {
            focus(index + 1);
        }
    };

    return {
        code: digits.join(''),
        digits,
        focus,
        reset,
        setInputRef: (index, input) => { inputs.current[index] = input; },
        onChange,
        onKeyDown,
        onPaste: applyDigits,
    };
}

export default function OtpInput({
    controller,
    disabled = false,
    label = 'Six-digit verification code',
}: OtpInputProps) {
    return (
        <S.Group role="group" aria-label={label}>
            {controller.digits.map((digit, index) => (
                <S.Input
                    key={index}
                    ref={input => controller.setInputRef(index, input)}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={index === 0 ? controller.digits.length : 1}
                    value={digit}
                    disabled={disabled}
                    onChange={event => controller.onChange(index, event)}
                    onKeyDown={event => controller.onKeyDown(index, event)}
                    onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
                        event.preventDefault();
                        controller.onPaste(index, event.clipboardData.getData('text'));
                    }}
                    aria-label={`Digit ${index + 1}`}
                />
            ))}
        </S.Group>
    );
}
