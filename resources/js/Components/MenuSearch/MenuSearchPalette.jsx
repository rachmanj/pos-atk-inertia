import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import hasAnyPermission from '../../Utils/Permissions';
import { NAV_MENUS } from '../../Utils/navMenu';

export default function MenuSearchPalette({
    placeholder = 'Search Menu here',
    showLabel = false,
}) {
    const { props } = usePage();
    const permissions = props.auth?.permissions || {};

    const [query, setQuery] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const inputRef = useRef(null);
    const listRef = useRef(null);
    const blurTimeoutRef = useRef(null);

    const visibleMenus = useMemo(() => {
        const q = query.toLowerCase().trim();

        return NAV_MENUS.filter((m) => {
            if (!hasAnyPermission([m.permission], permissions)) return false;
            if (!q) return true;
            return (
                m.label.toLowerCase().includes(q) ||
                (m.group && m.group.toLowerCase().includes(q))
            );
        });
    }, [query, permissions]);

    const grouped = useMemo(() => {
        if (query.trim()) return null;

        const map = new Map();
        for (const m of visibleMenus) {
            const key = m.group || '__nogroup__';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(m);
        }
        return map;
    }, [visibleMenus, query]);

    useEffect(() => {
        if (highlightIndex >= visibleMenus.length) {
            setHighlightIndex(Math.max(0, visibleMenus.length - 1));
        }
    }, [visibleMenus.length, highlightIndex]);

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

    const focusInput = useCallback(() => {
        if (modalOrSwalOpen()) return;
        if (isEditableFocused()) return;
        document.getElementById('menu-search-input')?.focus();
    }, []);

    const navigateTo = useCallback((href) => {
        setQuery('');
        setHighlightIndex(0);
        setDropdownOpen(false);
        inputRef.current?.blur();
        router.visit(href);
    }, []);

    const handleGlobalKeyDown = useCallback(
        (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                if (
                    'ontouchstart' in window ||
                    navigator.maxTouchPoints > 0
                ) {
                    return;
                }
                e.preventDefault();
                focusInput();
            }
        },
        [focusInput],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () =>
            document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);

    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }
        };
    }, []);

    const handleFocus = () => {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }
        setDropdownOpen(true);
    };

    const handleBlur = () => {
        blurTimeoutRef.current = setTimeout(() => {
            setDropdownOpen(false);
        }, 150);
    };

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setQuery('');
                setHighlightIndex(0);
                setDropdownOpen(false);
                inputRef.current?.blur();
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
        [visibleMenus, highlightIndex, navigateTo],
    );

    useEffect(() => {
        if (!listRef.current) return;
        const active = listRef.current.querySelector(
            '[data-highlighted="true"]',
        );
        if (active) {
            active.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
    }, [highlightIndex]);

    return (
        <div className="d-none d-md-flex align-items-center ms-auto me-2 position-relative menu-search-wrapper">
            {showLabel ? (
                <label
                    htmlFor="menu-search-input"
                    className="menu-search-label"
                >
                    Search Menu
                </label>
            ) : null}
            {/* <label htmlFor="menu-search-input" className="menu-search-label">Search Menu</label> */}

            <div className="d-flex align-items-center border rounded bg-white px-2 py-1 menu-search-field">
                <i className="fas fa-search text-muted small me-2"></i>
                <input
                    ref={inputRef}
                    id="menu-search-input"
                    type="text"
                    className="border-0 outline-none bg-transparent menu-search-input"
                    style={{ width: '12rem', fontSize: '0.875rem' }}
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setHighlightIndex(0);
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                />
                <kbd className="text-muted small border rounded px-1.5 py-0.5 ms-2 d-none d-sm-inline">
                    esc
                </kbd>
            </div>

            {dropdownOpen && (
                <div
                    ref={listRef}
                    className="position-absolute top-100 start-0 end-0 mt-1 bg-white border rounded shadow-sm overflow-y-auto menu-search-dropdown"
                    style={{ maxHeight: '70vh', zIndex: 1050 }}
                >
                    {visibleMenus.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            Tidak ada menu yang cocok
                        </div>
                    ) : grouped ? (
                        Array.from(grouped.entries()).map(
                            ([groupName, items]) => (
                                <div key={groupName}>
                                    {groupName !== '__nogroup__' && (
                                        <div className="px-3 pt-2 pb-1 text-uppercase small fw-bold text-muted">
                                            {groupName}
                                        </div>
                                    )}
                                    {items.map((menu) => {
                                        const globalIdx =
                                            visibleMenus.indexOf(menu);
                                        return (
                                            <button
                                                key={menu.id}
                                                type="button"
                                                data-highlighted={
                                                    highlightIndex === globalIdx
                                                }
                                                className={`d-block w-100 text-start px-3 py-2 border-0 ${
                                                    highlightIndex === globalIdx
                                                        ? 'bg-primary text-white'
                                                        : 'bg-white text-dark hover:bg-light'
                                                }`}
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
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
                        visibleMenus.map((menu, idx) => (
                            <button
                                key={menu.id}
                                type="button"
                                data-highlighted={highlightIndex === idx}
                                className={`d-block w-100 text-start px-3 py-2 border-0 ${
                                    highlightIndex === idx
                                        ? 'bg-primary text-white'
                                        : 'bg-white text-dark hover:bg-light'
                                }`}
                                onMouseDown={(e) => e.preventDefault()}
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
            )}
        </div>
    );
}
