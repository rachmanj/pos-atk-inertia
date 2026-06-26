import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";

const reasonLabels = {
    defect: "Barang Rusak",
    expired: "Kedaluwarsa",
    wrong_item: "Barang Tidak Sesuai",
    other: "Lainnya",
};

export default function SupplierReturnIndex() {
    const { supplierReturns, suppliers, filters, flash } = usePage().props;

    const [search, setSearch] = useState(filters.q || "");
    const [supplierId, setSupplierId] = useState(filters.supplier_id || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/supplier-returns", {
            q: search,
            supplier_id: supplierId,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleReset = () => {
        setSearch("");
        setSupplierId("");
        setStartDate("");
        setEndDate("");

        router.get("/account/supplier-returns");
    };

    return (
        <>
            <Head>
                <title>Retur Supplier - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-undo me-2"></i>
                                    RETUR SUPPLIER
                                </h5>

                                {hasAnyPermission(["purchases.index"]) && (
                                    <Link
                                        href="/account/purchases"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fas fa-shopping-bag me-2"></i>
                                        LIHAT PEMBELIAN
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
                                                placeholder="Cari invoice retur, invoice pembelian, supplier, atau pembuat..."
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

                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>
                                                    No.
                                                </th>
                                                <th>Invoice Retur</th>
                                                <th>Invoice Pembelian</th>
                                                <th>Tanggal</th>
                                                <th>Supplier</th>
                                                <th>Alasan</th>
                                                <th className="text-center">
                                                    Qty
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
                                            {supplierReturns.data.length > 0 ? (
                                                supplierReturns.data.map(
                                                    (item, index) => (
                                                        <tr key={item.id}>
                                                            <td className="fw-bold text-center">
                                                                {++index +
                                                                    (supplierReturns.current_page -
                                                                        1) *
                                                                        supplierReturns.per_page}
                                                            </td>

                                                            <td className="fw-bold text-primary">
                                                                {item.invoice}
                                                            </td>

                                                            <td>
                                                                {item.purchase
                                                                    ?.invoice ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {new Date(
                                                                    item.return_date,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                )}
                                                            </td>

                                                            <td>
                                                                {item.supplier
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {reasonLabels[
                                                                    item.reason
                                                                ] ||
                                                                    item.reason}
                                                            </td>

                                                            <td className="text-center fw-bold">
                                                                {item.total_qty}
                                                            </td>

                                                            <td className="text-end fw-bold text-danger">
                                                                {formatRupiah(
                                                                    item.total_amount,
                                                                )}
                                                            </td>

                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "supplier_returns.show",
                                                                    ],
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/supplier-returns/${item.invoice}`}
                                                                        className="btn btn-secondary btn-sm shadow-sm"
                                                                    >
                                                                        <i className="fas fa-eye me-1"></i>
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
                                                        supplier.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={supplierReturns.links}
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
