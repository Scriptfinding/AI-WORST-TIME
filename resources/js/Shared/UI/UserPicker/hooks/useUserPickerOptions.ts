import { useCallback, useEffect, useRef, useState } from 'react';
import { csrfHeaders } from '@/Shared/Utils/csrf';

export interface PickerUser {
    id: Id;
    name: string;
    email: string;
    workspace_role?: 'admin' | 'manager' | 'member';
}

// Loads searchable user options and resolves the selected user for UserPicker.
export function useUserPickerOptions(open: boolean, value: Id | null, fetchUrl: string) {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<PickerUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<PickerUser | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const openRef = useRef(open);
    const searchValueRef = useRef(search);
    const valueRef = useRef(value);
    const selectedUserRef = useRef(selectedUser);
    const fetchUrlRef = useRef(fetchUrl);
    const requestIdRef = useRef(0);

    openRef.current = open;
    searchValueRef.current = search;
    valueRef.current = value;
    selectedUserRef.current = selectedUser;
    fetchUrlRef.current = fetchUrl;

    const fetchUsers = useCallback(async (q: string) => {
        const requestId = ++requestIdRef.current;
        const currentFetchUrl = fetchUrlRef.current;
        const currentValue = valueRef.current;
        const currentSelectedUser = selectedUserRef.current;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            const res = await fetch(`${currentFetchUrl}?${params}`, {
                headers: csrfHeaders(),
            });
            if (!res.ok) throw new Error('Unable to load users');
            const data: PickerUser[] = await res.json();
            if (requestId !== requestIdRef.current) return;

            setUsers(data);
            if (currentValue && !currentSelectedUser) {
                const match = data.find(user => user.id === currentValue);
                if (match) setSelectedUser(match);
            }
        } catch {
            if (requestId === requestIdRef.current) setUsers([]);
        } finally {
            if (requestId === requestIdRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        fetchUsers(searchValueRef.current);
    }, [fetchUsers, open]);

    useEffect(() => {
        if (!openRef.current) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchUsers(search), 250);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [fetchUsers, search]);

    useEffect(() => {
        if (value === null) {
            setSelectedUser(null);
            return;
        }
        if (selectedUserRef.current && selectedUserRef.current.id === value) return;

        setSelectedUser(null);
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(`${fetchUrl}?id=${encodeURIComponent(value)}`, {
                    headers: csrfHeaders(),
                    signal: controller.signal,
                });
                const data: PickerUser[] = await res.json();
                const match = data.find(user => user.id === value);
                if (match) setSelectedUser(match);
            } catch {}
        })();

        return () => controller.abort();
    }, [value, fetchUrl]);

    const refresh = useCallback(
        () => fetchUsers(searchValueRef.current),
        [fetchUsers],
    );

    return {
        search,
        setSearch,
        users,
        loading,
        refresh,
        selectedUser,
        setSelectedUser,
    };
}
