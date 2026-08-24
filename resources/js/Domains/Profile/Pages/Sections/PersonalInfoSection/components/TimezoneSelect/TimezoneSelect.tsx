import { useMemo, useRef, useState } from 'react';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import { TIMEZONE_OPTIONS } from '@/Shared/Utils/timezones';
import * as S from './styled';

interface TimezoneSelectProps {
    value: string;
    error?: string;
    onChange: (value: string) => void;
}

export default function TimezoneSelect({ value, error, onChange }: TimezoneSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const fieldRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredTimezones = useMemo(() => {
        if (!search) return TIMEZONE_OPTIONS;

        const query = search.toLowerCase();
        return TIMEZONE_OPTIONS.filter(timezone =>
            timezone.value.toLowerCase().includes(query)
            || timezone.label.toLowerCase().includes(query)
        );
    }, [search]);

    const currentLabel = useMemo(() => {
        const match = TIMEZONE_OPTIONS.find(timezone => timezone.value === value);
        return match?.label ?? value;
    }, [value]);

    useSearchablePopover({
        open: isOpen,
        onDismiss: () => setIsOpen(false),
        reset: () => setSearch(''),
        focusRef: inputRef,
        containerRefs: [fieldRef],
        eventType: 'mousedown',
        focusDelay: 0,
    });

    const handleSelect = (timezone: string) => {
        onChange(timezone);
        setIsOpen(false);
        setSearch('');
    };

    const handleToggle = () => {
        setIsOpen(open => !open);
    };

    return (
        <S.Field ref={fieldRef}>
            <S.Label>Timezone</S.Label>
            <S.Trigger type="button" onClick={handleToggle}>
                {currentLabel}
                <S.Chevron $open={isOpen}>&#9662;</S.Chevron>
            </S.Trigger>
            {isOpen && (
                <S.Dropdown>
                    <S.SearchInput
                        ref={inputRef}
                        placeholder="Search timezone..."
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        autoFocus
                    />
                    <S.List>
                        {filteredTimezones.length > 0 ? filteredTimezones.map(timezone => (
                            <S.Item
                                key={timezone.value}
                                $active={timezone.value === value}
                                onClick={() => handleSelect(timezone.value)}
                            >
                                {timezone.label}
                            </S.Item>
                        )) : (
                            <S.Empty>No timezone found</S.Empty>
                        )}
                    </S.List>
                </S.Dropdown>
            )}
            {error && <S.ErrorText>{error}</S.ErrorText>}
        </S.Field>
    );
}
