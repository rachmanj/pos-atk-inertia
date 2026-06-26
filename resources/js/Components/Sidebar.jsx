import React, { useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import hasAnyPermission from "../Utils/Permissions";

export default function Sidebar() {
    const { url, props } = usePage();

    const { auth } = props;

    const permissions = auth?.permissions || {};

    const sidebarRef = useRef(null);

    useEffect(() => {
        if (sidebarRef.current) {
            const activeItem = sidebarRef.current.querySelector(".active");
            if (activeItem) {
                activeItem.scrollIntoView({
                    behavior: "auto",
                    block: "center",
                });
            }
        }
    }, [url]);

    const menuClass = (path) =>
        `${
            url.startsWith(path) ? "active " : ""
        }list-group-item list-group-item-action list-group-item-light p-3 text-decoration-none`;

    return (
        <>
            <div className="list-group list-group-flush" ref={sidebarRef}>
                {hasAnyPermission(["dashboard.index"], permissions) && (
                    <Link
                        href="/account/dashboard"
                        className={menuClass("/account/dashboard")}
                    >
                        <i className="fa fa-tachometer-alt fa-fw me-2"></i>
                        Dashboard
                    </Link>
                )}

                {hasAnyPermission(
                    ["roles.index", "users.index", "settings.index"],
                    permissions,
                ) && (
                    <div className="list-group-item bg-sidebar-group text-uppercase fw-bold small mt-2 py-2">
                        Pengaturan Sistem
                    </div>
                )}

                {hasAnyPermission(["roles.index"], permissions) && (
                    <Link
                        href="/account/roles"
                        className={menuClass("/account/roles")}
                    >
                        <i className="fa fa-shield-alt fa-fw me-2"></i>
                        Role
                    </Link>
                )}

                {hasAnyPermission(["users.index"], permissions) && (
                    <Link
                        href="/account/users"
                        className={menuClass("/account/users")}
                    >
                        <i className="fa fa-users fa-fw me-2"></i>
                        User
                    </Link>
                )}

                {hasAnyPermission(["settings.index"], permissions) && (
                    <Link
                        href="/account/settings"
                        className={menuClass("/account/settings")}
                    >
                        <i className="fa fa-store fa-fw me-2"></i>
                        Store Settings
                    </Link>
                )}

                {hasAnyPermission(
                    [
                        "categories.index",
                        "products.index",
                        "units.index",
                        "suppliers.index",
                        "customers.index",
                    ],
                    permissions,
                ) && (
                    <div className="list-group-item bg-sidebar-group text-uppercase fw-bold small mt-2 py-2">
                        Master Data
                    </div>
                )}

                {hasAnyPermission(["categories.index"], permissions) && (
                    <Link
                        href="/account/categories"
                        className={menuClass("/account/categories")}
                    >
                        <i className="fa fa-tags fa-fw me-2"></i>
                        Category
                    </Link>
                )}

                {hasAnyPermission(["suppliers.index"], permissions) && (
                    <Link
                        href="/account/suppliers"
                        className={menuClass("/account/suppliers")}
                    >
                        <i className="fa fa-truck fa-fw me-2"></i>
                        Suppliers
                    </Link>
                )}

                {hasAnyPermission(["customers.index"], permissions) && (
                    <Link
                        href="/account/customers"
                        className={menuClass("/account/customers")}
                    >
                        <i className="fa fa-address-book fa-fw me-2"></i>
                        Customers
                    </Link>
                )}

                {hasAnyPermission(["products.index"], permissions) && (
                    <Link
                        href="/account/products"
                        className={menuClass("/account/products")}
                    >
                        <i className="fa fa-cube fa-fw me-2"></i>
                        Produk
                    </Link>
                )}

                {hasAnyPermission(["units.index"], permissions) && (
                    <Link
                        href="/account/units"
                        className={menuClass("/account/units")}
                    >
                        <i className="fa fa-balance-scale fa-fw me-2"></i>
                        Satuan
                    </Link>
                )}

                {hasAnyPermission(
                    ["ppob-accounts.index", "ppob-balance-logs.index"],
                    permissions,
                ) && (
                    <div className="list-group-item bg-sidebar-group text-uppercase fw-bold small mt-2 py-2">
                        PPOB
                    </div>
                )}

                {hasAnyPermission(["ppob-accounts.index"], permissions) && (
                    <Link
                        href="/account/ppob-accounts"
                        className={menuClass("/account/ppob-accounts")}
                    >
                        <i className="fa fa-wallet fa-fw me-2"></i>
                        Akun PPOB
                    </Link>
                )}

                {hasAnyPermission(["ppob-balance-logs.index"], permissions) && (
                    <Link
                        href="/account/ppob-balance-logs"
                        className={menuClass("/account/ppob-balance-logs")}
                    >
                        <i className="fa fa-list fa-fw me-2"></i>
                        Riwayat Saldo
                    </Link>
                )}

                {hasAnyPermission(
                    ["stock_movements.index", "stock_opnames.index"],
                    permissions,
                ) && (
                    <div className="list-group-item bg-sidebar-group text-uppercase fw-bold small mt-2 py-2">
                        Inventory
                    </div>
                )}

                {hasAnyPermission(["stock_movements.index"], permissions) && (
                    <Link
                        href="/account/stock-movements"
                        className={menuClass("/account/stock-movements")}
                    >
                        <i className="fa fa-exchange-alt fa-fw me-2"></i>
                        Mutasi Stok
                    </Link>
                )}

                {hasAnyPermission(["stock_opnames.index"], permissions) && (
                    <Link
                        href="/account/stock-opnames"
                        className={menuClass("/account/stock-opnames")}
                    >
                        <i className="fa fa-clipboard-check fa-fw me-2"></i>
                        Stock Opname
                    </Link>
                )}

                {hasAnyPermission(
                    ["purchases.index", "supplier_returns.index"],
                    permissions,
                ) && (
                    <div className="list-group-item bg-sidebar-group text-uppercase fw-bold small mt-2 py-2">
                        Transaksi Supplier
                    </div>
                )}

                {hasAnyPermission(["purchases.index"], permissions) && (
                    <Link
                        href="/account/purchases"
                        className={menuClass("/account/purchases")}
                    >
                        <i className="fa fa-shopping-cart fa-fw me-2"></i>
                        Pembelian Supplier
                    </Link>
                )}

                {hasAnyPermission(["supplier_returns.index"], permissions) && (
                    <Link
                        href="/account/supplier-returns"
                        className={menuClass("/account/supplier-returns")}
                    >
                        <i className="fa fa-undo fa-fw me-2"></i>
                        Retur Supplier
                    </Link>
                )}

                {hasAnyPermission(
                    [
                        "cashier_shifts.index",
                        "transactions.create",
                        "transactions.index",
                        "returns.index",
                        "expenses.index",
                    ],
                    permissions,
                ) && (
                    <div className="list-group-item bg-sidebar-group text-uppercase fw-bold small mt-2 py-2">
                        Penjualan
                    </div>
                )}

                {hasAnyPermission(["cashier_shifts.index"], permissions) && (
                    <Link
                        href="/account/cashier-shifts"
                        className={menuClass("/account/cashier-shifts")}
                    >
                        <i className="fa fa-clock fa-fw me-2"></i>
                        Shift Kasir
                    </Link>
                )}

                {hasAnyPermission(["transactions.create"], permissions) && (
                    <Link
                        href="/account/transactions/create"
                        className={menuClass("/account/transactions/create")}
                    >
                        <i className="fa fa-cash-register fa-fw me-2"></i>
                        POS Kasir
                    </Link>
                )}

                {hasAnyPermission(["transactions.index"], permissions) && (
                    <Link
                        href="/account/transactions"
                        className={menuClass("/account/transactions", {
                            except: ["/account/transactions/create"],
                        })}
                    >
                        <i className="fa fa-receipt fa-fw me-2"></i>
                        Riwayat Transaksi
                    </Link>
                )}

                {hasAnyPermission(["returns.index"], permissions) && (
                    <Link
                        href="/account/returns"
                        className={menuClass("/account/returns")}
                    >
                        <i className="fa fa-undo fa-fw me-2"></i>
                        Retur Customer
                    </Link>
                )}

                {hasAnyPermission(["expenses.index"], permissions) && (
                    <Link
                        href="/account/expenses"
                        className={menuClass("/account/expenses")}
                    >
                        <i className="fa fa-money-bill-wave fa-fw me-2"></i>
                        Pengeluaran
                    </Link>
                )}

                {hasAnyPermission(
                    ["reports.sales", "profits.index", "reports.stock"],
                    permissions,
                ) && (
                    <div className="list-group-item bg-sidebar-group text-uppercase fw-bold small mt-2 py-2">
                        Laporan
                    </div>
                )}

                {hasAnyPermission(["reports.sales"], permissions) && (
                    <Link
                        href="/account/reports/sales"
                        className={menuClass("/account/reports/sales")}
                    >
                        <i className="fa fa-chart-line fa-fw me-2"></i>
                        Laporan Penjualan
                    </Link>
                )}

                {hasAnyPermission(["profits.index"], permissions) && (
                    <Link
                        href="/account/reports/profit"
                        className={menuClass("/account/reports/profit")}
                    >
                        <i className="fa fa-coins fa-fw me-2"></i>
                        Laporan Laba
                    </Link>
                )}

                {hasAnyPermission(["reports.stock"], permissions) && (
                    <Link
                        href="/account/reports/stock"
                        className={menuClass("/account/reports/stock")}
                    >
                        <i className="fa fa-chart-bar fa-fw me-2"></i>
                        Laporan Stok
                    </Link>
                )}
            </div>
        </>
    );
}
