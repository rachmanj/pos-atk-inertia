import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function ProfitReport() {
    const {
        profits,
        summary,
        filters = {},
        cashiers = [],
        isAdmin = false,
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [cashierId, setCashierId] = useState(filters.cashier_id || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/reports/profit", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId,
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate(filters.start_date || "");
        setEndDate(filters.end_date || "");
        setCashierId("");

        router.get("/account/reports/profit");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/profit", {
            q: search,
            start_date: start,
            end_date: end,
            cashier_id: cashierId,
        });
    };

    const handleExport = () => {
        window.location.href = `/account/reports/profit/export?start_date=${startDate}&end_date=${endDate}&cashier_id=${cashierId}`;
    };

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <>
            <Head title="Laporan Laba" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-coins me-2"></i>
                                    LAPORAN LABA
                                </h5>
                                {hasAnyPermission(["reports.export"], permissions) && (
                                    <button
                                        type="button"
                                        className="btn btn-success btn-sm shadow-sm"
                                        onClick={handleExport}
                                    >
                                        <i className="far fa-file-excel me-1"></i>
                                        Export Excel
                                    </button>
                                )}
                            </div>

                            <div className="card-body">
                                <form onSubmit={handleFilter} className="mb-4">
                                    <div className="row g-3">
                                        <div className="col-lg-4">
                                            <input
                                                type="text"
                                                className="form-control border-0 shadow-sm"
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                placeholder="Cari invoice, customer, atau kasir..."
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <input
                                                type="date"
                                                className="form-control border-0 shadow-sm"
                                                value={startDate}
                                                onChange={(e) =>
                                                    setStartDate(e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <input
                                                type="date"
                                                className="form-control border-0 shadow-sm"
                                                value={endDate}
                                                onChange={(e) =>
                                                    setEndDate(e.target.value)
                                                }
                                            />
                                        </div>

                                        {isAdmin && (
                                            <div className="col-lg-2">
                                                <select
                                                    className="form-select border-0 shadow-sm"
                                                    value={cashierId}
                                                    onChange={(e) =>
                                                        setCashierId(
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Semua Kasir
                                                    </option>
                                                    {cashiers.map((cashier) => (
                                                        <option
                                                            key={cashier.id}
                                                            value={cashier.id}
                                                        >
                                                            {cashier.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="col-lg-2 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary shadow-sm w-100"
                                            >
                                                <i className="fas fa-filter me-2"></i>
                                                Filter
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-secondary shadow-sm w-100"
                                                onClick={handleReset}
                                            >
                                                <i className="fas fa-sync-alt me-2"></i>
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <Link
                                            href={`/account/reports/profit?start_date=${filters.start_date}&end_date=${filters.end_date}`}
                                            className="border rounded-3 p-3 h-100 text-decoration-none text-reset d-block"
                                        >
                                            <small className="text-muted">
                                                Pendapatan
                                            </small>
                                            <h6 className="fw-bold text-success mb-1">
                                                {formatRupiah(
                                                    summary.total_revenue,
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Transaksi:{" "}
                                                {summary.total_transactions}
                                                {summary.average_sale > 0 && (
                                                    <> · Rata-rata: {formatRupiah(summary.average_sale)}</>
                                                )}
                                            </small>
                                        </Link>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                HPP
                                            </small>
                                            <h6 className="fw-bold text-danger mb-1">
                                                {formatRupiah(
                                                    summary.total_cost,
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Margin: {summary.profit_margin}%
                                                {summary.net_margin_pct != null && (
                                                    <> · Net: {summary.net_margin_pct}%</>
                                                )}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Laba Kotor
                                            </small>
                                            <h6 className="fw-bold text-primary mb-1">
                                                {formatRupiah(
                                                    summary.gross_profit,
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Sebelum expense
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Laba Bersih
                                            </small>
                                            <h6
                                                className={`fw-bold mb-1 ${
                                                    summary.net_profit >= 0
                                                        ? "text-success"
                                                        : "text-danger"
                                                }`}
                                            >
                                                {formatRupiah(
                                                    summary.net_profit,
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Expense:{" "}
                                                {formatRupiah(
                                                    summary.total_expense,
                                                )}
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>
                                                    No.
                                                </th>
                                                <th>Invoice</th>
                                                <th>Tanggal</th>
                                                <th>Kasir</th>
                                                <th>Customer</th>
                                                <th className="text-end">
                                                    Pendapatan
                                                </th>
                                                <th className="text-end">
                                                    HPP
                                                </th>
                                                <th className="text-end">
                                                    Laba
                                                </th>
                                                <th
                                                    className="text-center"
                                                    style={{ width: "12%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {profits.data.length > 0 ? (
                                                profits.data.map(
                                                    (profit, index) => {
                                                        const transaction =
                                                            profit.transaction;

                                                        return (
                                                            <tr key={profit.id}>
                                                                <td className="fw-bold text-center">
                                                                    {index +
                                                                        1 +
                                                                        (profits.current_page -
                                                                            1) *
                                                                            profits.per_page}
                                                                </td>
                                                                <td className="fw-bold text-primary">
                                                                    {transaction?.invoice ||
                                                                        "-"}
                                                                </td>
                                                                <td>
                                                                    {formatDate(
                                                                        transaction?.paid_at ||
                                                                            transaction?.created_at,
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {transaction
                                                                        ?.cashier
                                                                        ?.name ||
                                                                        "-"}
                                                                </td>
                                                                <td>
                                                                    {transaction
                                                                        ?.customer
                                                                        ?.name ||
                                                                        "Umum"}
                                                                </td>
                                                                <td className="text-end fw-bold text-success">
                                                                    {formatRupiah(
                                                                        profit.total_revenue,
                                                                    )}
                                                                </td>
                                                                <td className="text-end text-danger">
                                                                    {formatRupiah(
                                                                        profit.total_cost,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    className={`text-end fw-bold ${
                                                                        profit.profit_amount >=
                                                                        0
                                                                            ? "text-primary"
                                                                            : "text-danger"
                                                                    }`}
                                                                >
                                                                    {formatRupiah(
                                                                        profit.profit_amount,
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    {hasAnyPermission(
                                                                        [
                                                                            "transactions.show",
                                                                        ],
                                                                        permissions,
                                                                    ) &&
                                                                    transaction ? (
                                                                        <Link
                                                                            href={`/account/transactions/${transaction.invoice}`}
                                                                            className="btn btn-secondary btn-sm shadow-sm"
                                                                        >
                                                                            <i className="fas fa-eye me-1"></i>
                                                                            Detail
                                                                        </Link>
                                                                    ) : (
                                                                        "-"
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="9"
                                                        className="text-center py-4"
                                                    >
                                                        Belum ada data laba
                                                        untuk filter ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={profits.links}
                                        align="end"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
