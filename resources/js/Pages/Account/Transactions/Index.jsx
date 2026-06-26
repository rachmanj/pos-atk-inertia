import Pagination from "../../../Shared/Pagination";
import LayoutAccount from "../../../Layouts/Account";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import hasAnyPermission from "../../../Utils/Permissions";

export default function Index() {
    const {
        transactions,
        filters = {},
        flash = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.search || "");
    const [paymentMethod, setPaymentMethod] = useState(
        filters.payment_method || "",
    );
    const [paymentStatus, setPaymentStatus] = useState(
        filters.payment_status || "",
    );

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/transactions", {
            search,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
        });
    };

    const handleReset = () => {
        setSearch("");
        setPaymentMethod("");
        setPaymentStatus("");

        router.get("/account/transactions");
    };

    const paymentMethodLabel = (method) => {
        if (method === "cash") {
            return "Tunai";
        }

        if (method === "digital") {
            return "Digital";
        }

        return "-";
    };

    const paymentStatusLabel = (status) => {
        if (status === "unpaid") {
            return "Belum Bayar";
        }

        if (status === "paid") {
            return "Lunas";
        }

        if (status === "pending") {
            return "Pending";
        }

        if (status === "failed") {
            return "Gagal";
        }

        if (status === "expired") {
            return "Expired";
        }

        return "-";
    };

    const paymentStatusBadge = (status) => {
        if (status === "unpaid") {
            return "badge bg-secondary shadow-sm";
        }

        if (status === "paid") {
            return "badge bg-success shadow-sm";
        }

        if (status === "pending") {
            return "badge bg-warning text-dark shadow-sm";
        }

        if (status === "failed") {
            return "badge bg-danger shadow-sm";
        }

        if (status === "expired") {
            return "badge bg-dark shadow-sm";
        }

        return "badge bg-light text-dark border shadow-sm";
    };

    const transactionStatusLabel = (status) => {
        if (status === "completed") {
            return "Selesai";
        }

        if (status === "pending") {
            return "Pending";
        }

        if (status === "voided") {
            return "Dibatalkan";
        }

        return "-";
    };

    const transactionStatusBadge = (status) => {
        if (status === "completed") {
            return "badge bg-success shadow-sm";
        }

        if (status === "pending") {
            return "badge bg-warning text-dark shadow-sm";
        }

        if (status === "voided") {
            return "badge bg-danger shadow-sm";
        }

        return "badge bg-light text-dark border shadow-sm";
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <>
            <Head title="Riwayat Transaksi" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-receipt me-2"></i>
                                    RIWAYAT TRANSAKSI
                                </h5>

                                {hasAnyPermission(
                                    ["transactions.create"],
                                    permissions,
                                ) && (
                                    <Link
                                        href="/account/transactions/create"
                                        className="btn btn-success shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-cash-register me-2"></i>
                                        POS KASIR
                                    </Link>
                                )}
                            </div>

                            <div className="card-body">
                                {flash.success && (
                                    <div className="alert alert-success shadow-sm">
                                        {flash.success}
                                    </div>
                                )}

                                {flash.error && (
                                    <div className="alert alert-danger shadow-sm">
                                        {flash.error}
                                    </div>
                                )}

                                <form onSubmit={handleFilter} className="mb-4">
                                    <div className="row g-3">
                                        <div className="col-lg-4">
                                            <input
                                                type="text"
                                                className="form-control border-0 shadow-sm"
                                                placeholder="Cari invoice, kasir, atau customer..."
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="col-lg-3">
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

                                        <div className="col-lg-3">
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={paymentStatus}
                                                onChange={(e) =>
                                                    setPaymentStatus(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Semua Pembayaran
                                                </option>
                                                <option value="unpaid">
                                                    Belum Bayar
                                                </option>
                                                <option value="pending">
                                                    Pending
                                                </option>
                                                <option value="paid">
                                                    Lunas
                                                </option>
                                                <option value="failed">
                                                    Gagal
                                                </option>
                                                <option value="expired">
                                                    Expired
                                                </option>
                                            </select>
                                        </div>

                                        <div className="col-lg-2 d-flex gap-2">
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
                                                <th className="text-center">
                                                    Metode
                                                </th>
                                                <th className="text-center">
                                                    Pembayaran
                                                </th>
                                                <th className="text-center">
                                                    Status Transaksi
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
                                            {transactions.data.length > 0 ? (
                                                transactions.data.map(
                                                    (transaction, index) => (
                                                        <tr
                                                            key={transaction.id}
                                                            className={
                                                                transaction.status ===
                                                                "voided"
                                                                    ? "table-light"
                                                                    : ""
                                                            }
                                                        >
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (transactions.current_page -
                                                                        1) *
                                                                        transactions.per_page}
                                                            </td>

                                                            <td
                                                                className={
                                                                    transaction.status ===
                                                                    "voided"
                                                                        ? "fw-bold text-danger"
                                                                        : "fw-bold text-primary"
                                                                }
                                                            >
                                                                {
                                                                    transaction.invoice
                                                                }
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    transaction.created_at,
                                                                )}
                                                            </td>

                                                            <td>
                                                                {transaction
                                                                    .cashier
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {transaction
                                                                    .customer
                                                                    ?.name ||
                                                                    "Umum"}
                                                            </td>

                                                            <td className="text-center">
                                                                <span className="badge bg-light border shadow-sm">
                                                                    {paymentMethodLabel(
                                                                        transaction.payment_method,
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td className="text-center">
                                                                <span
                                                                    className={paymentStatusBadge(
                                                                        transaction.payment_status,
                                                                    )}
                                                                >
                                                                    {paymentStatusLabel(
                                                                        transaction.payment_status,
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td className="text-center">
                                                                <span
                                                                    className={transactionStatusBadge(
                                                                        transaction.status,
                                                                    )}
                                                                >
                                                                    {transactionStatusLabel(
                                                                        transaction.status,
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td className="text-end fw-bold text-success">
                                                                {formatRupiah(
                                                                    transaction.grand_total,
                                                                )}
                                                            </td>

                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "transactions.show",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/transactions/${transaction.invoice}`}
                                                                        className="btn btn-secondary btn-sm shadow-sm"
                                                                    >
                                                                        <i className="fa fa-eye me-1"></i>
                                                                        Detail
                                                                    </Link>
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
                                                        Belum ada data
                                                        transaksi.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={transactions.links}
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
