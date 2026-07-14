import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import hasAnyPermission from '../../Utils/Permissions';
import { NAV_MENUS } from '../../Utils/navMenu';

/**
 * Ctrl+K command palette for quick menu navigation.
 *
 * Behaviour:
 *  - Ctrl+K / Cmd+K  → open palette (global listener)
 *  - Esc              → close; return focus to trigger
 *  - ArrowUp/Down     → move highlight through visible results
 *  - Enter            → navigate to highlighted menu via router.visit()
 *  - Click            → navigate to clicked menu via router.visit()
 *  - Type in input    → instant filter (no debounce; 23 items)
 *
 * Guards:
 *  - Does not open when a Bootstrap .modal.show or SweetAlert2 .swal2-container is visible.
 *  - Does not open when focus sits inside an <input>, <textarea>, or [contenteditable]
 *    (prevents clashing with POS barcode scanner and form fields).
 *  - On mobile / touch, the navbar button is the only trigger — keyboard shortcut is suppressed.
 */

export default function MenuSearchPalette({ triggerRef }) {
    const { props } = usePage();
    const permissions = props.auth?.permissions || {};

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(0);

    const inputRef = useRef(null);
    const listRef = useRef(null);

    // ── filtered & grouped visible menus ──────────────────────────────────────

    const visibleMenus = useMemo(() => {
        const q = query.toLowerCase().trim();

        const filtered = NAV_MENUS.filter((m) => {
            // Must have permission
            if (!hasAnyPermission([m.permission], permissions)) return false;
            // Empty query → show all
            if (!q) return true;
            // Match label or group
            return (
                m.label.toLowerCase().includes(q) ||
                (m.group && m.group.toLowerCase().includes(q))
            );
        });

        return filtered;
    }, [query, permissions]);

    // Keep highlight within bounds
    useEffect(() => {
        if (highlightIndex >= visibleMenus.length) {
            setHighlightIndex(Math.max(0, visibleMenus.length - 1));
        }
    }, [visibleMenus.length, highlightIndex]);

    // ── open / close ──────────────────────────────────────────────────────────

    const isEditableFocused = () => {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName?.toLowerCase();
        return (
            tag === 'input' ||
            tag === 'textarea' ||
            tag === 'select' ||
            el.isContentEditable
        );
    };

    const modalOrSwalOpen = () => {
        return !!document.querySelector('.swal2-container, .modal.show');
    };

    const openPalette = useCallback(() => {
        if (modalOrSwalOpen()) return;
        if (isEditableFocused()) return;

        setQuery('');
        setHighlightIndex(0);
        setOpen(true);
        // Focus input after render
        requestAnimationFrame(() => inputRef.current?.focus());
    }, []);

    const closePalette = useCallback(() => {
        setOpen(false);
        // Return focus to trigger button
        triggerRef?.current?.focus();
    }, [triggerRef]);

    // ── navigate ──────────────────────────────────────────────────────────────

    const navigateTo = useCallback(
        (href) => {
            closePalette();
            router.visit(href);
        },
        [closePalette],
    );

    // ── keyboard handlers ─────────────────────────────────────────────────────

    const handleGlobalKeyDown = useCallback(
        (e) => {
            // Ctrl+K or Cmd+K (macOS)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                // Suppress on touch devices — Ctrl+K unavailable
                if (
                    'ontouchstart' in window ||
                    navigator.maxTouchPoints > 0
                ) {
                    return;
                }
                e.preventDefault();
                openPalette();
            }
        },
        [openPalette],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () =>
            document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closePalette();
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightIndex((prev) =>
                    Math.min(prev + 1, visibleMenus.length - 1),
                );
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                const menu = visibleMenus[highlightIndex];
                if (menu) navigateTo(menu.href);
            }
        },
        [visibleMenus, highlightIndex, closePalette, navigateTo],
    );

    // ── scroll highlighted item into view ────────────────────────────────────

    useEffect(() => {
        if (!listRef.current) return;
        const active = listRef.current.querySelector(
            '[data-highlighted="true"]',
        );
        if (active) {
            active.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
    }, [highlightIndex]);

    // ── click-outside-to-close ────────────────────────────────────────────────

    const handleBackdropClick = useCallback(
        (e) => {
            if (e.target === e.currentTarget) closePalette();
        },
        [closePalette],
    );

    // ── render ────────────────────────────────────────────────────────────────

    if (!open) return null;

    // Build grouped view for empty query
    const grouped = useMemo(() => {
        if (query.trim()) return null; // only group when query is empty

        const map = new Map();
        for (const m of visibleMenus) {
            const key = m.group || '__nogroup__';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(m);
        }
        return map;
    }, [visibleMenus, query]);

    return (
        <div
            className="fixed inset-0 z-[1055] flex items-start justify-center pt-[15vh]"
            onClick={handleBackdropClick}
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 flex flex-col"
                style={{ maxHeight: '70vh' }}
            >
                {/* ── search input ──────────────────────────────────────── */}
                <div className="flex items-center border-b px-4 py-3">
                    <i className="fas fa-search text-muted me-2"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-grow border-0 outline-none text-base bg-transparent"
                        placeholder="Cari menu…"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setHighlightIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <kbd className="text-muted small border rounded px-1.5 py-0.5 ms-2 d-none d-sm-inline">
                        esc
                    </kbd>
                </div>

                {/* ── results ────────────────────────────────────────────── */}
                <div ref={listRef} className="overflow-y-auto flex-grow py-1">
                    {visibleMenus.length === 0 ? (
                        <div className="text-center text-muted py-5">
                            Tidak ada menu yang cocok
                        </div>
                    ) : grouped ? (
                        /* Grouped view (empty query) */
                        Array.from(grouped.entries()).map(
                            ([groupName, items]) => (
                                <div key={groupName}>
                                    {groupName !== '__nogroup__' && (
                                        <div className="px-4 pt-2 pb-1 text-uppercase small fw-bold text-muted">
                                            {groupName}
                                        </div>
                                    )}
                                    {items.map((menu, idx) => {
                                        const globalIdx =
                                            visibleMenus.indexOf(menu);
                                        return (
                                            <button
                                                key={menu.id}
                                                data-highlighted={
                                                    highlightIndex ===
                                                    globalIdx
                                                }
                                                className={`d-block w-100 text-start px-4 py-2 border-0 ${
                                                    highlightIndex === globalIdx
                                                        ? 'bg-primary text-white'
                                                        : 'bg-white text-dark hover:bg-light'
                                                }`}
                                                onMouseEnter={() =>
                                                    setHighlightIndex(globalIdx)
                                                }
                                                onClick={() =>
                                                    navigateTo(menu.href)
                                                }
                                            >
                                                {menu.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            ),
                        )
                    ) : (
                        /* Flat view (filtered) */
                        visibleMenus.map((menu, idx) => (
                            <button
                                key={menu.id}
                                data-highlighted={highlightIndex === idx}
                                className={`d-block w-100 text-start px-4 py-2 border-0 ${
                                    highlightIndex === idx
                                        ? 'bg-primary text-white'
                                        : 'bg-white text-dark hover:bg-light'
                                }`}
                                onMouseEnter={() => setHighlightIndex(idx)}
                                onClick={() => navigateTo(menu.href)}
                            >
                                <span>{menu.label}</span>
                                {menu.group && (
                                    <span className="small text-muted ms-2 opacity-75">
                                        {menu.group}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* ── footer hint ────────────────────────────────────────── */}
                <div className="border-t px-4 py-2 small text-muted d-flex justify-content-between">
                    <span>
                        <kbd className="border rounded px-1">↑↓</kbd> navigasi
                    </span>
                    <span>
                        <kbd className="border rounded px-1">↵</kbd> buka
                    </span>
                    <span>
                        <kbd className="border rounded px-1">esc</kbd> tutup
                    </span>
                </div>
            </div>
        </div>
    );
}