import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage } from "@inertiajs/react";
import { formatRupiah } from "../../../Utils/format";

const paymentMethodLabels = {
    cash: "Tunai",
    digital: "Digital",
};

const paymentStatusLabels = {
    unpaid: "Belum Bayar",
    pending: "Pending",
    paid: "Lunas",
    expired: "Expired",
    failed: "Gagal",
};

const paymentStatusClasses = {
    unpaid: "bg-secondary",
    pending: "bg-warning text-dark",
    paid: "bg-success",
    expired: "bg-dark",
    failed: "bg-danger",
};

const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const quickPanelScrollStyle = {
    maxHeight: "260px",
    overflowY: "auto",
    paddingRight: "6px",
};

function StatCard({ title, value, subtitle, icon, color }) {
    return (
        <div className="col-12 col-md-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                        <div>
                            <div className="text-secondary fw-bold small text-uppercase mb-2">
                                {title}
                            </div>
                            <h4 className="fw-bold text-dark mb-1">{value}</h4>
                            <small className="text-muted">{subtitle}</small>
                        </div>
                        <div
                            className={`bg-${color} bg-opacity-10 text-${color} rounded-3 d-flex align-items-center justify-content-center shrink-0`}
                            style={{ width: "46px", height: "46px" }}
                        >
                            <i className={`${icon} fa-lg`}></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const {
        auth,
        summary = {},
        activeShift,
        recentTransactions = [],
        lowStockProducts = [],
        ppobAccount = null,
    } = usePage().props;

    const netProfitColor =
        Number(summary.today_net_profit || 0) < 0 ? "danger" : "success";
    const lowStockColor =
        Number(summary.low_stock_count || 0) > 0 ? "danger" : "secondary";

    const stats = [
        {
            title: "Penjualan Bruto Hari Ini",
            value: formatRupiah(summary.today_sales || 0),
            subtitle: `${summary.today_transactions || 0} transaksi lunas aktif, tidak termasuk void`,
            icon: "fa fa-money",
            color: "primary",
        },
        {
            title: "Transaksi Hari Ini",
            value: summary.today_transactions || 0,
            subtitle: `Rata-rata ${formatRupiah(summary.today_average_sale || 0)}`,
            icon: "fa fa-file-text-o",
            color: "info",
        },
        {
            title: "Laba Bersih",
            value: formatRupiah(summary.today_net_profit || 0),
            subtitle: `Pengeluaran ${formatRupiah(summary.today_expense || 0)}`,
            icon: "fa fa-line-chart",
            color: netProfitColor,
        },
        {
            title: "Stok Menipis",
            value: summary.low_stock_count || 0,
            subtitle: `Dari ${summary.active_products || 0} produk aktif`,
            icon: "fa fa-cubes",
            color: lowStockColor,
        },
    ];

    return (
        <>
            <Head>
                <title>Dashboard - ZenPOS</title>
            </Head>
            <LayoutAccount>
                <div className="row mt-4 px-2">
                    <div className="col-12 mb-4">
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                            <div>
                                <h4 className="fw-bold text-dark mb-1">
                                    Dashboard
                                </h4>
                                <div className="text-muted">
                                    Ringkasan operasional hari ini
                                </div>
                            </div>
                            <div className="alert alert-success border-0 shadow-sm mb-0 py-2 px-3">
                                Selamat datang,{" "}
                                <strong>{auth.user.name}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4 px-2 mb-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.title} {...stat} />
                    ))}
                </div>

                {ppobAccount && (
                    <div className="row g-4 px-2 mb-4">
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className={`card border-0 shadow-sm rounded-3 h-100 ${ppobAccount.is_low_balance ? "border-danger" : ""}`}>
                                <div className="card-body p-4">
                                    <div className="text-secondary fw-bold small text-uppercase mb-2">Saldo PPOB</div>
                                    <h4 className={`fw-bold mb-1 ${ppobAccount.is_low_balance ? "text-danger" : "text-dark"}`}>{formatRupiah(ppobAccount.current_balance)}</h4>
                                    <small className="text-muted">{ppobAccount.name}{ppobAccount.is_low_balance ? " · Saldo rendah" : ""}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="row g-4 px-2 mb-4">
                    <div className="col-12 col-xl-4">
                        <div className="card border-0 shadow-sm rounded-3 h-100">
                            <div className="card-header bg-white border-0 p-4 pb-0">
                                <h5 className="mb-0 fw-bold text-dark">
                                    <i className="fa fa-clock-o text-success me-2" aria-hidden="true"></i>
                                    Shift Kasir
                                </h5>
                            </div>
                            <div className="card-body p-4">
                                {activeShift ? (
                                    <>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <div className="text-secondary small fw-bold text-uppercase mb-1">
                                                    Status
                                                </div>
                                                <h5 className="fw-bold text-success mb-0">
                                                    Aktif
                                                </h5>
                                            </div>
                                            <span className="badge bg-success shadow-sm">
                                                #{activeShift.id}
                                            </span>
                                        </div>
                                        <div className="text-muted small mb-4">
                                            Dibuka{" "}
                                            {formatDateTime(
                                                activeShift.opened_at,
                                            )}
                                        </div>
                                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                                            <span className="text-muted">
                                                Uang Awal
                                            </span>
                                            <strong>
                                                {formatRupiah(
                                                    activeShift.cash_in_hand,
                                                )}
                                            </strong>
                                        </div>
                                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                                            <span className="text-muted">
                                                Penjualan Tunai
                                            </span>
                                            <strong>
                                                {formatRupiah(
                                                    activeShift.cash_sales,
                                                )}
                                            </strong>
                                        </div>
                                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                                            <span className="text-muted">
                                                Estimasi Kas
                                            </span>
                                            <strong className="text-success">
                                                {formatRupiah(
                                                    activeShift.expected_cash,
                                                )}
                                            </strong>
                                        </div>
                                        <div className="d-flex justify-content-between mb-4">
                                            <span className="text-muted">
                                                Transaksi Shift
                                            </span>
                                            <strong>
                                                {activeShift.total_transactions}
                                            </strong>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <i className="fa fa-clock-o fa-3x text-secondary opacity-50 mb-3" aria-hidden="true"></i>
                                        <h6 className="fw-bold mb-2">
                                            Belum ada shift aktif
                                        </h6>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-xl-8">
                        <div className="card border-0 shadow-sm rounded-3 h-100">
                            <div className="card-header bg-white border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold text-dark">
                                    <i className="fa fa-pie-chart text-primary me-2" aria-hidden="true"></i>
                                    Pantauan Cepat
                                </h5>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4">
                                    <div className="col-12 col-lg-7">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold mb-0">
                                                Transaksi Terakhir
                                            </h6>
                                        </div>
                                        <div
                                            className="table-responsive"
                                            style={quickPanelScrollStyle}
                                        >
                                            <table className="table table-borderless align-middle mb-0">
                                                <tbody>
                                                    {recentTransactions.length >
                                                    0 ? (
                                                        recentTransactions.map(
                                                            (transaction) => (
                                                                <tr
                                                                    key={
                                                                        transaction.id
                                                                    }
                                                                >
                                                                    <td className="ps-0">
                                                                        <div className="fw-bold text-dark">
                                                                            {
                                                                                transaction.invoice
                                                                            }
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {transaction
                                                                                .customer
                                                                                ?.name ||
                                                                                "Umum"}{" "}
                                                                            ·{" "}
                                                                            {paymentMethodLabels[
                                                                                transaction
                                                                                    .payment_method
                                                                            ] ||
                                                                                transaction.payment_method}
                                                                        </small>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <div className="fw-bold">
                                                                            {formatRupiah(
                                                                                transaction.grand_total,
                                                                            )}
                                                                        </div>
                                                                        <span
                                                                            className={`badge shadow-sm ${paymentStatusClasses[transaction.payment_status] || "bg-secondary"}`}
                                                                        >
                                                                            {paymentStatusLabels[
                                                                                transaction
                                                                                    .payment_status
                                                                            ] ||
                                                                                transaction.payment_status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td className="text-center text-muted py-4">
                                                                Belum ada
                                                                transaksi.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="col-12 col-lg-5">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold mb-0">
                                                Stok Menipis
                                            </h6>
                                        </div>
                                        <div style={quickPanelScrollStyle}>
                                            {lowStockProducts.length > 0 ? (
                                                lowStockProducts.map(
                                                    (product) => (
                                                        <div
                                                            key={product.id}
                                                            className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2"
                                                        >
                                                            <div className="me-3">
                                                                <div className="fw-bold text-dark">
                                                                    {
                                                                        product.title
                                                                    }
                                                                </div>
                                                                <small className="text-muted">
                                                                    Perlu
                                                                    restock
                                                                </small>
                                                            </div>
                                                            <span className="badge bg-danger shadow-sm">
                                                                {product.stock}{" "}
                                                                {product.unit}
                                                            </span>
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <div className="text-center text-muted py-4">
                                                    Stok aman.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
