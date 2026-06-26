import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";

const statusLabels = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
};

const statusBadges = {
    pending: "badge bg-warning text-dark shadow-sm",
    approved: "badge bg-success shadow-sm",
    rejected: "badge bg-danger shadow-sm",
};

export default function Index() {
    const { returns, filters = {}, flash = {}, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [status, setStatus] = useState(filters.status || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get(
            "/account/returns",
            {
                q: search,
                status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleReset = () => {
        setSearch("");
        setStatus("");

        router.get("/account/returns");
    };

    return (
        <>
            <Head title="Retur Penjualan" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-undo me-2"></i>
                                    RETUR PENJUALAN
                                </h5>

                                {hasAnyPermission(
                                    ["transactions.index"],
                                    permissions,
                                ) && (
                                    <Link
                                        href="/account/transactions"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-receipt me-2"></i>
                                        LIHAT TRANSAKSI
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
                                        <div className="col-lg-6">
                                            <input
                                                type="text"
                                                className="form-control border-0 shadow-sm"
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                placeholder="Cari invoice retur, invoice transaksi, atau kasir..."
                                            />
                                        </div>

                                        <div className="col-lg-3">
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={status}
                                                onChange={(e) =>
                                                    setStatus(e.target.value)
                                                }
                                            >
                                                <option value="">
                                                    Semua Status
                                                </option>
                                                <option value="pending">
                                                    Menunggu
                                                </option>
                                                <option value="approved">
                                                    Disetujui
                                                </option>
                                                <option value="rejected">
                                                    Ditolak
                                                </option>
                                            </select>
                                        </div>

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

                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>
                                                    No.
                                                </th>
                                                <th>Invoice Retur</th>
                                                <th>Invoice Transaksi</th>
                                                <th>Tanggal</th>
                                                <th>Kasir</th>
                                                <th className="text-center">
                                                    Status
                                                </th>
                                                <th className="text-center">
                                                    Qty
                                                </th>
                                                <th className="text-end">
                                                    Refund
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
                                            {returns.data.length > 0 ? (
                                                returns.data.map(
                                                    (item, index) => (
                                                        <tr key={item.id}>
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (returns.current_page -
                                                                        1) *
                                                                        returns.per_page}
                                                            </td>

                                                            <td className="fw-bold text-primary">
                                                                {item.invoice}
                                                            </td>

                                                            <td>
                                                                {item
                                                                    .transaction
                                                                    ?.invoice ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {new Date(
                                                                    item.created_at,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                )}
                                                            </td>

                                                            <td>
                                                                {item.cashier
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>

                                                            <td className="text-center">
                                                                <span
                                                                    className={
                                                                        statusBadges[
                                                                            item
                                                                                .status
                                                                        ] ||
                                                                        "badge bg-light text-dark border shadow-sm"
                                                                    }
                                                                >
                                                                    {statusLabels[
                                                                        item
                                                                            .status
                                                                    ] ||
                                                                        item.status ||
                                                                        "-"}
                                                                </span>
                                                            </td>

                                                            <td className="text-center fw-bold">
                                                                {item.total_qty ||
                                                                    0}
                                                            </td>

                                                            <td className="text-end fw-bold text-success">
                                                                {formatRupiah(
                                                                    item.total_refund,
                                                                )}
                                                            </td>

                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "returns.show",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/returns/${item.invoice}`}
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
                                                        colSpan="9"
                                                        className="text-center py-4"
                                                    >
                                                        Belum ada data retur
                                                        penjualan.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={returns.links}
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
