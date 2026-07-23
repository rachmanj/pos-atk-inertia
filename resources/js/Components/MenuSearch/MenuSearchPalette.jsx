import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { SearchOutlined } from "@ant-design/icons";
import { Dropdown, Input } from "antd";
import hasAnyPermission from "../../Utils/Permissions";
import { NAV_MENUS } from "../../Utils/navMenu";

export default function MenuSearchPalette({
    placeholder = "Search Menu here",
}) {
    const { props } = usePage();
    const permissions = props.auth?.permissions || {};

    const [query, setQuery] = useState("");
    const [highlightIndex, setHighlightIndex] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const inputRef = useRef(null);
    const listRef = useRef(null);

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
            const key = m.group || "__nogroup__";
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
            tag === "input" ||
            tag === "textarea" ||
            tag === "select" ||
            el.isContentEditable
        );
    };

    const modalOpen = () => {
        return !!document.querySelector(".ant-modal-wrap, .ant-modal-root");
    };

    const focusInput = useCallback(() => {
        if (modalOpen()) return;
        if (isEditableFocused()) return;
        setDropdownOpen(true);
        inputRef.current?.focus();
    }, []);

    const navigateTo = useCallback((href) => {
        setQuery("");
        setHighlightIndex(0);
        setDropdownOpen(false);
        inputRef.current?.blur();
        router.visit(href);
    }, []);

    const handleGlobalKeyDown = useCallback(
        (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                if (
                    "ontouchstart" in window ||
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
        document.addEventListener("keydown", handleGlobalKeyDown);
        return () =>
            document.removeEventListener("keydown", handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                setQuery("");
                setHighlightIndex(0);
                setDropdownOpen(false);
                inputRef.current?.blur();
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((prev) =>
                    Math.min(prev + 1, visibleMenus.length - 1),
                );
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === "Enter") {
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
            active.scrollIntoView({ block: "nearest", behavior: "auto" });
        }
    }, [highlightIndex, dropdownOpen]);

    const renderMenuButton = (menu, idx) => (
        <button
            key={menu.id}
            type="button"
            data-highlighted={highlightIndex === idx}
            className={`menu-search-item${
                highlightIndex === idx ? " menu-search-item--active" : ""
            }`}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setHighlightIndex(idx)}
            onClick={() => navigateTo(menu.href)}
        >
            <span>{menu.label}</span>
            {menu.group && query.trim() ? (
                <span className="menu-search-item-group">{menu.group}</span>
            ) : null}
        </button>
    );

    const dropdownContent = (
        <div ref={listRef} className="menu-search-dropdown">
            {visibleMenus.length === 0 ? (
                <div className="menu-search-empty">Tidak ada menu yang cocok</div>
            ) : grouped ? (
                Array.from(grouped.entries()).map(([groupName, items]) => (
                    <div key={groupName}>
                        {groupName !== "__nogroup__" && (
                            <div className="menu-search-group-label">
                                {groupName}
                            </div>
                        )}
                        {items.map((menu) =>
                            renderMenuButton(
                                menu,
                                visibleMenus.indexOf(menu),
                            ),
                        )}
                    </div>
                ))
            ) : (
                visibleMenus.map((menu, idx) => renderMenuButton(menu, idx))
            )}
        </div>
    );

    return (
        <div className="menu-search-wrapper">
            <Dropdown
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
                trigger={["click"]}
                placement="bottomLeft"
                menu={{ items: [] }}
                popupRender={() => dropdownContent}
            >
                <Input
                    ref={inputRef}
                    id="menu-search-input"
                    allowClear
                    prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                    suffix={
                        <kbd className="menu-search-kbd">Ctrl+K</kbd>
                    }
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setHighlightIndex(0);
                        setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                    style={{ width: 280 }}
                />
            </Dropdown>
        </div>
    );
}
