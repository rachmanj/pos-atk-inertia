import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";

export default function PurchaseIndex() {
    const {
        purchases,
        suppliers = [],
        filters = {},
        flash = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [supplierId, setSupplierId] = useState(filters.supplier_id || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/purchases", {
            q: search,
            supplier_id: supplierId,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleReset = () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const formatDate = (date) =>
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        setSearch("");
        setSupplierId("");
        setStartDate(formatDate(monthStart));
        setEndDate(formatDate(now));

        router.get("/account/purchases");
    };

    return (
        <>
            <Head>
                <title>Pembelian - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-shopping-bag me-2"></i>
                                    PEMBELIAN
                                </h5>

                                {hasAnyPermission(
                                    ["purchases.create"],
                                    permissions,
                                ) && (
                                    <Link
                                        href="/account/purchases/create"
                                        className="btn btn-success shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-plus-circle me-2"></i>
                                        TAMBAH PEMBELIAN
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
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                placeholder="Cari invoice, supplier, atau pembuat..."
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={supplierId}
                                                onChange={(e) =>
                                                    setSupplierId(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Semua Supplier
                                                </option>

                                                {suppliers.map((supplier) => (
                                                    <option
                                                        key={supplier.id}
                                                        value={supplier.id}
                                                    >
                                                        {supplier.name}
                                                    </option>
                                                ))}
                                            </select>
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
                                                <th>Supplier</th>
                                                <th>Pembuat</th>
                                                <th className="text-center">
                                                    Item
                                                </th>
                                                <th className="text-center">
                                                    Qty
                                                </th>
                                                <th className="text-end">
                                                    Total
                                                </th>
                                                <th
                                                    className="text-center"
                                                    style={{ width: "14%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {purchases.data.length > 0 ? (
                                                purchases.data.map(
                                                    (purchase, index) => (
                                                        <tr key={purchase.id}>
                                                            <td className="fw-bold text-center">
                                                                {++index +
                                                                    (purchases.current_page -
                                                                        1) *
                                                                        purchases.per_page}
                                                            </td>

                                                            <td className="fw-bold text-primary">
                                                                {
                                                                    purchase.invoice
                                                                }
                                                            </td>

                                                            <td>
                                                                {new Date(
                                                                    purchase.purchase_date,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                )}
                                                            </td>

                                                            <td>
                                                                {purchase
                                                                    .supplier
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {purchase.user
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>

                                                            <td className="text-center fw-bold">
                                                                {
                                                                    purchase.total_items
                                                                }
                                                            </td>

                                                            <td className="text-center fw-bold">
                                                                {
                                                                    purchase.total_qty
                                                                }
                                                            </td>

                                                            <td className="text-end fw-bold text-success">
                                                                {formatRupiah(
                                                                    purchase.total_amount,
                                                                )}
                                                            </td>

                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "purchases.show",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/purchases/${purchase.invoice}`}
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
                                                        Belum ada data
                                                        pembelian.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={purchases.links}
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
