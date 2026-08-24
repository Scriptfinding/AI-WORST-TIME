import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { SearchSelect, SearchSelectTrigger, SearchSelectArrow, SearchSelectDropdown, SearchSelectInput, SearchSelectList, SearchSelectOption, SearchSelectEmpty } from './ChannelSearchSelect.styled';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';

export default function ChannelSearchSelect({ options, value, onChange }: {
    options: { id: string; name: string }[];
    value: string;
    onChange: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: inputRef,
        containerRefs: [containerRef],
        eventType: 'mousedown',
    });

    const filtered = search
        ? options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
        : options;

    const selected = options.find(o => o.id === value);

    return (
        <SearchSelect ref={containerRef}>
            <SearchSelectTrigger
                type="button"
                $open={open}
                $hasValue={!!value}
                onClick={() => {
                    setOpen(current => !current);
                    setSearch('');
                }}
            >
                {selected ? selected.name : '-- Pick a channel --'}
                <SearchSelectArrow $open={open}>
                    <Icon icon="lucide:chevron-down" width={14} />
                </SearchSelectArrow>
            </SearchSelectTrigger>
            {open && (
                <SearchSelectDropdown>
                    <SearchSelectInput
                        ref={inputRef}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search channels..."
                    />
                    <SearchSelectList>
                        {filtered.length === 0 ? (
                            <SearchSelectEmpty>No channels match your search</SearchSelectEmpty>
                        ) : (
                            filtered.map(ch => (
                                <SearchSelectOption
                                    key={ch.id}
                                    type="button"
                                    $selected={ch.id === value}
                                    onClick={() => {
                                        onChange(ch.id);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    {ch.name}
                                </SearchSelectOption>
                            ))
                        )}
                    </SearchSelectList>
                </SearchSelectDropdown>
            )}
        </SearchSelect>
    );
}
