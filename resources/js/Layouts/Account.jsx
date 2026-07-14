import React, { useState, useRef } from "react";
import { NavDropdown } from "react-bootstrap";
import { usePage, router, Link } from "@inertiajs/react";
import Sidebar from "../Components/Sidebar";
import MenuSearchPalette from "../Components/MenuSearch/MenuSearchPalette";

export default function LayoutAccount({ children }) {
    const { auth, store } = usePage().props;
    const [sidebarToggle, setSidebarToggle] = useState(false);

    const storeName = store?.name || "VASIA STORE";
    const storeLogo = store?.logo_url;

    const userName = auth?.user?.name || "User";

    // Ref for the menu search trigger button (focus restore on close)
    const menuSearchTriggerRef = useRef(null);

    const sidebarToggleHandler = (e) => {
        e.preventDefault();

        if (!sidebarToggle) {
            document.body.classList.add("sb-sidenav-toggled");
            setSidebarToggle(true);
        } else {
            document.body.classList.remove("sb-sidenav-toggled");
            setSidebarToggle(false);
        }
    };

    // function logout
    const logoutHandler = (e) => {
        e.preventDefault();

        router.post("/logout");
    };

    return (
        <>
            {/* ── Ctrl+K command palette (mounted once in layout) ──────── */}
            <MenuSearchPalette triggerRef={menuSearchTriggerRef} />

            <div className="d-flex" id="wrapper">
                <div className="bg-sidebar" id="sidebar-wrapper">
                    <div className="sidebar-heading bg-light">
                        <div className="sidebar-store-brand">
                            {storeLogo ? (
                                <img
                                    src={storeLogo}
                                    className="sidebar-store-logo"
                                    alt={storeName}
                                />
                            ) : (
                                <span className="sidebar-store-logo-placeholder">
                                    <i className="fas fa-store"></i>
                                </span>
                            )}

                            <strong className="sidebar-store-name">
                                {storeName}
                            </strong>
                        </div>
                    </div>

                    <Sidebar />
                </div>

                <div id="page-content-wrapper">
                    <nav className="navbar navbar-expand-lg navbar-light bg-light">
                        <div className="container-fluid">
                            <button
                                className="btn btn-success-dark"
                                onClick={sidebarToggleHandler}
                            >
                                <i className="fas fa-list-ul"></i>
                            </button>

                            {/* ── menu search trigger ─────────────────────── */}
                            <button
                                ref={menuSearchTriggerRef}
                                className="btn btn-outline-secondary ms-2 d-flex align-items-center gap-1"
                                onClick={() => {
                                    // Programmatically trigger the palette.
                                    // We fire a synthetic Ctrl+K so the global
                                    // listener inside MenuSearchPalette handles it.
                                    const event = new KeyboardEvent(
                                        "keydown",
                                        {
                                            key: "k",
                                            ctrlKey: true,
                                            bubbles: true,
                                        },
                                    );
                                    document.dispatchEvent(event);
                                }}
                                title="Cari menu (Ctrl+K)"
                            >
                                <i className="fas fa-search small"></i>
                                <kbd className="d-none d-sm-inline small bg-light text-dark border rounded px-1.5 py-0">
                                    ⌘K
                                </kbd>
                            </button>

                            <ul className="navbar-nav ms-auto mb-0">
                                <NavDropdown
                                    align="end"
                                    title={userName}
                                    className="fw-bold"
                                    id="user-nav-dropdown"
                                >
                                    <NavDropdown.Item
                                        as={Link}
                                        href="/account/password"
                                    >
                                        <i
                                            className="fas fa-key me-2"
                                            aria-hidden="true"
                                        ></i>
                                        Ubah Kata Sandi
                                    </NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={logoutHandler}>
                                        <i
                                            className="fas fa-sign-out-alt me-2"
                                            aria-hidden="true"
                                        ></i>
                                        Keluar
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </ul>
                        </div>
                    </nav>

                    <div className="container-fluid">{children}</div>
                </div>
            </div>
        </>
    );
}