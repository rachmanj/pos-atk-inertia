import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link, router } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";

const typeOptions = [
    { value: "", label: "Semua Tipe" },
    { value: "in", label: "Masuk" },
    { value: "out", label: "Keluar" },
    { value: "adjustment", label: "Koreksi" },
];

const typeClasses = {
    in: "bg-success",
    out: "bg-danger",
    adjustment: "bg-primary",
};

const typeLabels = {
    in: "MASUK",
    out: "KELUAR",
    adjustment: "KOREKSI",
};

const getStockDelta = (movement) =>
    Number(movement.stock_after ?? 0) - Number(movement.stock_before ?? 0);

const formatStockDelta = (movement) => {
    const delta = getStockDelta(movement);

    return delta > 0 ? `+${delta}` : String(delta);
};

const deltaClass = (movement) => {
    const delta = getStockDelta(movement);

    if (delta > 0) {
        return "text-success";
    }

    if (delta < 0) {
        return "text-danger";
    }

    return "text-muted";
};

export default function StockMovementIndex() {
    const { stockMovements, filters, flash, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [type, setType] = useState(filters.type || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/stock-movements", {
            q: search,
            type: type,
        });
    };

    const handleReset = () => {
        setSearch("");
        setType("");

        router.get("/account/stock-movements");
    };

    return (
        <>
            <Head>
                <title>Mutasi Stok - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-layer-group me-2"></i>
                                    MUTASI STOK
                                </h5>

                                <div>
                                    {hasAnyPermission(
                                        ["stock_movements.create"],
                                        permissions,
                                    ) && (
                                        <Link
                                            href="/account/stock-movements/create"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fas fa-plus-circle me-2"></i>
                                            KOREKSI STOK
                                        </Link>
                                    )}
                                </div>
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
                                        <div className="col-md-6">
                                            <input
                                                type="text"
                                                className="form-control shadow-sm"
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                placeholder="Cari produk, barcode, pengguna, atau catatan..."
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <select
                                                className="form-select shadow-sm"
                                                value={type}
                                                onChange={(e) =>
                                                    setType(e.target.value)
                                                }
                                            >
                                                {typeOptions.map((item) => (
                                                    <option
                                                        key={item.value}
                                                        value={item.value}
                                                    >
                                                        {item.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-3 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary shadow-sm w-100"
                                            >
                                                <i className="fas fa-filter me-2"></i>
                                                TERAPKAN
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="btn btn-secondary shadow-sm w-100"
                                            >
                                                <i className="fas fa-sync me-2"></i>
                                                ATUR ULANG
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
                                                <th>Tanggal</th>
                                                <th>Produk</th>
                                                <th className="text-center">
                                                    Tipe
                                                </th>
                                                <th className="text-center">
                                                    Perubahan
                                                </th>
                                                <th className="text-center">
                                                    Sebelum
                                                </th>
                                                <th className="text-center">
                                                    Sesudah
                                                </th>
                                                <th>Sumber</th>
                                                <th>Pengguna</th>
                                                <th>Catatan</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {stockMovements.data.length > 0 ? (
                                                stockMovements.data.map(
                                                    (movement, index) => (
                                                        <tr key={movement.id}>
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (stockMovements.current_page -
                                                                        1) *
                                                                        stockMovements.per_page}
                                                            </td>

                                                            <td>
                                                                {new Date(
                                                                    movement.created_at,
                                                                ).toLocaleString(
                                                                    "id-ID",
                                                                )}
                                                            </td>

                                                            <td>
                                                                <div className="fw-bold">
                                                                    {movement
                                                                        .product
                                                                        ?.title ||
                                                                        "-"}
                                                                </div>
                                                                <small>
                                                                    {movement
                                                                        .product
                                                                        ?.barcode ||
                                                                        "-"}
                                                                </small>
                                                            </td>

                                                            <td className="text-center">
                                                                <span
                                                                    className={`badge shadow-sm ${
                                                                        typeClasses[
                                                                            movement
                                                                                .type
                                                                        ] ||
                                                                        "bg-secondary"
                                                                    }`}
                                                                >
                                                                    {typeLabels[
                                                                        movement
                                                                            .type
                                                                    ] ||
                                                                        movement.type}
                                                                </span>
                                                            </td>

                                                            <td
                                                                className={`text-center fw-bold ${deltaClass(
                                                                    movement,
                                                                )}`}
                                                            >
                                                                {formatStockDelta(
                                                                    movement,
                                                                )}
                                                            </td>

                                                            <td className="text-center">
                                                                {
                                                                    movement.stock_before
                                                                }
                                                            </td>

                                                            <td className="text-center fw-bold">
                                                                {
                                                                    movement.stock_after
                                                                }
                                                            </td>

                                                            <td>
                                                                <span className="badge bg-light border">
                                                                    {
                                                                        movement.source_label
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {movement.user
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {movement.note ||
                                                                    "-"}
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
                                                        Belum ada histori mutasi
                                                        stok.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={stockMovements.links}
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
