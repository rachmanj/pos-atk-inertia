import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";

const paymentMethodLabels = {
    cash: "Tunai",
    digital: "Digital",
};

const paymentMethodBadges = {
    cash: "badge bg-success shadow-sm",
    digital: "badge bg-primary shadow-sm",
};

export default function SalesReport() {
    const {
        sales,
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
    const [paymentMethod, setPaymentMethod] = useState(
        filters.payment_method || "",
    );
    const [cashierId, setCashierId] = useState(filters.cashier_id || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/reports/sales", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            payment_method: paymentMethod,
            cashier_id: cashierId,
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate(filters.start_date || "");
        setEndDate(filters.end_date || "");
        setPaymentMethod("");
        setCashierId("");

        router.get("/account/reports/sales");
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
            <Head title="Laporan Penjualan" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-chart-line me-2"></i>
                                    LAPORAN PENJUALAN
                                </h5>
                            </div>

                            <div className="card-body">
                                <form onSubmit={handleFilter} className="mb-4">
                                    <div className="row g-3">
                                        <div className="col-lg-3">
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

                                        <div className="col-lg-2">
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={paymentMethod}
                                                onChange={(e) =>
                                                    setPaymentMethod(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Semua Metode
                                                </option>
                                                <option value="cash">
                                                    Tunai
                                                </option>
                                                <option value="digital">
                                                    Digital
                                                </option>
                                            </select>
                                        </div>

                                        {isAdmin && (
                                            <div className="col-lg-3">
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

                                        <div className="col-lg-3 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary shadow-sm w-100"
                                            >
                                                <i className="fa fa-filter me-2"></i>
                                                Filter
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-secondary shadow-sm w-100"
                                                onClick={handleReset}
                                            >
                                                <i className="fa fa-sync-alt me-2"></i>
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Penjualan Bersih
                                            </small>
                                            <h6 className="fw-bold text-success mb-1">
                                                {formatRupiah(
                                                    summary.net_sales,
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Retur:{" "}
                                                {formatRupiah(
                                                    summary.total_returns,
                                                )}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Penjualan Kotor
                                            </small>
                                            <h6 className="fw-bold text-primary mb-1">
                                                {formatRupiah(
                                                    summary.total_sales,
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Diskon:{" "}
                                                {formatRupiah(
                                                    summary.total_discount,
                                                )}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Jumlah Transaksi
                                            </small>
                                            <h6 className="fw-bold mb-1">
                                                {summary.total_transactions}
                                            </h6>
                                            <small className="text-muted">
                                                Rata-rata:{" "}
                                                {formatRupiah(
                                                    summary.average_sale,
                                                )}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Digital Bersih
                                            </small>
                                            <h6 className="fw-bold text-primary mb-1">
                                                {formatRupiah(
                                                    summary.digital_sales,
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Tunai Bersih:{" "}
                                                {formatRupiah(
                                                    summary.cash_sales,
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
                                                <th>Tanggal Lunas</th>
                                                <th>Kasir</th>
                                                <th>Customer</th>
                                                <th className="text-center">
                                                    Metode
                                                </th>
                                                <th className="text-center">
                                                    Item
                                                </th>
                                                <th className="text-end">
                                                    Diskon
                                                </th>
                                                <th className="text-end">
                                                    Total
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
                                            {sales.data.length > 0 ? (
                                                sales.data.map(
                                                    (sale, index) => (
                                                        <tr key={sale.id}>
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (sales.current_page -
                                                                        1) *
                                                                        sales.per_page}
                                                            </td>
                                                            <td className="fw-bold text-primary">
                                                                {sale.invoice}
                                                            </td>
                                                            <td>
                                                                {formatDate(
                                                                    sale.paid_at ||
                                                                        sale.created_at,
                                                                )}
                                                            </td>
                                                            <td>
                                                                {sale.cashier
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>
                                                            <td>
                                                                {sale.customer
                                                                    ?.name ||
                                                                    "Umum"}
                                                            </td>
                                                            <td className="text-center">
                                                                <span
                                                                    className={
                                                                        paymentMethodBadges[
                                                                            sale
                                                                                .payment_method
                                                                        ] ||
                                                                        "badge bg-secondary shadow-sm"
                                                                    }
                                                                >
                                                                    {paymentMethodLabels[
                                                                        sale
                                                                            .payment_method
                                                                    ] ||
                                                                        sale.payment_method ||
                                                                        "-"}
                                                                </span>
                                                            </td>
                                                            <td className="text-center fw-bold">
                                                                {Number(
                                                                    sale.total_items ||
                                                                        0,
                                                                )}
                                                            </td>
                                                            <td className="text-end text-danger">
                                                                {formatRupiah(
                                                                    sale.discount,
                                                                )}
                                                            </td>
                                                            <td className="text-end fw-bold text-success">
                                                                {formatRupiah(
                                                                    sale.grand_total,
                                                                )}
                                                            </td>
                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "transactions.show",
                                                                    ],
                                                                    permissions,
                                                                ) ? (
                                                                    <Link
                                                                        href={`/account/transactions/${sale.invoice}`}
                                                                        className="btn btn-secondary btn-sm shadow-sm"
                                                                    >
                                                                        <i className="fa fa-eye me-1"></i>
                                                                        Detail
                                                                    </Link>
                                                                ) : (
                                                                    "-"
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="10"
                                                        className="text-center py-4"
                                                    >
                                                        Belum ada data penjualan
                                                        untuk filter ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={sales.links}
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
