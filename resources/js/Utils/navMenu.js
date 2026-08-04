/**
 * Static menu definitions — single source of truth for sidebar navigation.
 * Used by both MenuSearchPalette (Ctrl+K command palette) and optionally Sidebar.
 *
 * Each entry:
 *   id          — unique identifier
 *   label       — Indonesian display label
 *   group       — sidebar group header (null for Dashboard)
 *   permission  — Laravel permission gate name
 *   href        — Inertia route path
 */

export const NAV_MENUS = [
    { id: 'dashboard',     label: 'Dashboard',           group: null,                   permission: 'dashboard.index',          href: '/account/dashboard' },
    { id: 'shifts',        label: 'Shift Kasir',         group: 'Penjualan',            permission: 'cashier_shifts.index',     href: '/account/cashier-shifts' },
    { id: 'pos',           label: 'POS Kasir',           group: 'Penjualan',            permission: 'transactions.create',      href: '/account/transactions/create' },
    { id: 'transactions',  label: 'Riwayat Transaksi',   group: 'Penjualan',            permission: 'transactions.index',       href: '/account/transactions' },
    { id: 'returns',       label: 'Retur Customer',      group: 'Penjualan',            permission: 'returns.index',            href: '/account/returns' },
    { id: 'expenses',      label: 'Pengeluaran',         group: 'Penjualan',            permission: 'expenses.index',           href: '/account/expenses' },
    { id: 'categories',    label: 'Category',            group: 'Master Data',          permission: 'categories.index',         href: '/account/categories' },
    { id: 'suppliers',     label: 'Suppliers',           group: 'Master Data',          permission: 'suppliers.index',          href: '/account/suppliers' },
    { id: 'customers',     label: 'Customers',           group: 'Master Data',          permission: 'customers.index',          href: '/account/customers' },
    { id: 'products',      label: 'Produk',              group: 'Master Data',          permission: 'products.index',           href: '/account/products' },
    { id: 'units',         label: 'Satuan',              group: 'Master Data',          permission: 'units.index',              href: '/account/units' },
    { id: 'ppob-accounts', label: 'Akun PPOB',           group: 'PPOB',                 permission: 'ppob-accounts.index',      href: '/account/ppob-accounts' },
    { id: 'ppob-logs',     label: 'Riwayat Saldo',       group: 'PPOB',                 permission: 'ppob-balance-logs.index',  href: '/account/ppob-balance-logs' },
    { id: 'stock-mv',      label: 'Mutasi Stok',         group: 'Inventory',            permission: 'stock_movements.index',    href: '/account/stock-movements' },
    { id: 'stock-opname',  label: 'Stock Opname',        group: 'Inventory',            permission: 'stock_opnames.index',      href: '/account/stock-opnames' },
    { id: 'purchases',     label: 'Pembelian Supplier',  group: 'Transaksi Supplier',   permission: 'purchases.index',          href: '/account/purchases' },
    { id: 'supplier-ret',  label: 'Retur Supplier',      group: 'Transaksi Supplier',   permission: 'supplier_returns.index',   href: '/account/supplier-returns' },
    { id: 'report-sales',    label: 'Laporan Penjualan',   group: 'Laporan',              permission: 'reports.sales',            href: '/account/reports/sales' },
    { id: 'report-product',  label: 'Produk Terlaris',     group: 'Laporan',              permission: 'reports.product_sales',    href: '/account/reports/product-sales' },
    { id: 'report-ppob',     label: 'Laporan PPOB',        group: 'Laporan',              permission: 'reports.ppob',             href: '/account/reports/ppob' },
    { id: 'report-profit',   label: 'Laporan Laba',        group: 'Laporan',              permission: 'profits.index',            href: '/account/reports/profit' },
    { id: 'report-expense',  label: 'Laporan Biaya',       group: 'Laporan',              permission: 'reports.expense',          href: '/account/reports/expense' },
    { id: 'report-customers', label: 'Laporan Pelanggan',  group: 'Laporan',              permission: 'reports.customers',        href: '/account/reports/customers' },
    { id: 'report-stock',    label: 'Laporan Stok',        group: 'Laporan',              permission: 'reports.stock',            href: '/account/reports/stock' },
    { id: 'roles',         label: 'Role',                group: 'Pengaturan Sistem',    permission: 'roles.index',              href: '/account/roles' },
    { id: 'users',         label: 'User',                group: 'Pengaturan Sistem',    permission: 'users.index',              href: '/account/users' },
    { id: 'settings',      label: 'Store Settings',      group: 'Pengaturan Sistem',    permission: 'settings.index',           href: '/account/settings' },
];