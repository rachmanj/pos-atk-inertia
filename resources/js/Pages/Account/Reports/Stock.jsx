import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";

const movementTypeLabels = {
    in: "Masuk",
    out: "Keluar",
    adjustment: "Penyesuaian",
};

const getStockBadge = (stock, threshold) => {
    if (stock <= 0) {
        return {
            label: "Habis",
            className: "badge bg-danger shadow-sm",
        };
    }

    if (stock <= threshold) {
        return {
            label: "Menipis",
            className: "badge bg-warning text-dark shadow-sm",
        };
    }

    return {
        label: "Aman",
        className: "badge bg-success shadow-sm",
    };
};

export default function StockReport() {
    const {
        products,
        summary,
        filters = {},
        categories = [],
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [categoryId, setCategoryId] = useState(filters.category_id || "");
    const [stockStatus, setStockStatus] = useState(filters.stock_status || "");
    const [lowThreshold, setLowThreshold] = useState(
        filters.low_threshold || 10,
    );
    const [deadStockDays, setDeadStockDays] = useState(
        filters.dead_stock_days || 90,
    );

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/reports/stock", {
            q: search,
            category_id: categoryId,
            stock_status: stockStatus,
            low_threshold: lowThreshold,
            dead_stock_days: deadStockDays,
        });
    };

    const handleReset = () => {
        setSearch("");
        setCategoryId("");
        setStockStatus("");
        setLowThreshold(10);
        setDeadStockDays(90);

        router.get("/account/reports/stock");
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            q: search,
            category_id: categoryId,
            stock_status: stockStatus,
            low_threshold: lowThreshold,
            dead_stock_days: deadStockDays,
        });

        window.location.href = `/account/reports/stock/export?${params.toString()}`;
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
            <Head title="Laporan Stok" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-boxes me-2"></i>
                                    LAPORAN STOK
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
                                                placeholder="Cari produk, barcode, atau kategori..."
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={categoryId}
                                                onChange={(e) =>
                                                    setCategoryId(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Semua Kategori
                                                </option>
                                                {categories.map((category) => (
                                                    <option
                                                        key={category.id}
                                                        value={category.id}
                                                    >
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-lg-2">
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={stockStatus}
                                                onChange={(e) =>
                                                    setStockStatus(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Semua Status
                                                </option>
                                                <option value="available">
                                                    Aman
                                                </option>
                                                <option value="low">
                                                    Menipis
                                                </option>
                                                <option value="out">
                                                    Habis
                                                </option>
                                                <option value="dead_stock">
                                                    Dead Stock
                                                </option>
                                            </select>
                                        </div>

                                        <div className="col-lg-2">
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-control border-0 shadow-sm"
                                                value={lowThreshold}
                                                onChange={(e) =>
                                                    setLowThreshold(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Ambang menipis"
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-control border-0 shadow-sm"
                                                value={deadStockDays}
                                                onChange={(e) =>
                                                    setDeadStockDays(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Hari dead stock"
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

                                        <div className="col-12">
                                            <DatePreset
                                                onApply={(start, end) => {
                                                    router.get("/account/reports/stock", {
                                                        q: search,
                                                        category_id: categoryId,
                                                        stock_status: stockStatus,
                                                        low_threshold: lowThreshold,
                                                        dead_stock_days: deadStockDays,
                                                        start_date: start,
                                                        end_date: end,
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </form>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Total Produk
                                            </small>
                                            <h6 className="fw-bold mb-1">
                                                {summary.total_products}
                                            </h6>
                                            <small className="text-muted">
                                                Aktif: {summary.active_products}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Total Unit Stok
                                            </small>
                                            <h6 className="fw-bold mb-1">
                                                {summary.total_stock_qty}
                                            </h6>
                                            <small className="text-muted">
                                                Habis:{" "}
                                                {summary.out_of_stock_products}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Nilai Modal
                                            </small>
                                            <h6 className="fw-bold text-success mb-1">
                                                {formatRupiah(
                                                    summary.inventory_cost_value,
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Nilai jual:{" "}
                                                {formatRupiah(
                                                    summary.inventory_sell_value,
                                                )}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <Link
                                            href={`/account/reports/stock?stock_status=out`}
                                            className="border rounded-3 p-3 h-100 text-decoration-none text-reset d-block"
                                        >
                                            <small className="text-muted">
                                                Stok Habis
                                            </small>
                                            <h6 className="fw-bold text-danger mb-1">
                                                {summary.out_of_stock_products}
                                            </h6>
                                            <small className="text-muted">
                                                Klik untuk filter
                                            </small>
                                        </Link>
                                    </div>

                                    <div className="col-md-3">
                                        <Link
                                            href={`/account/reports/stock?stock_status=low&low_threshold=${filters.low_threshold}`}
                                            className="border rounded-3 p-3 h-100 text-decoration-none text-reset d-block"
                                        >
                                            <small className="text-muted">
                                                Produk Menipis
                                            </small>
                                            <h6 className="fw-bold text-warning mb-1">
                                                {summary.low_stock_products}
                                            </h6>
                                            <small className="text-muted">
                                                Ambang: {filters.low_threshold}
                                            </small>
                                        </Link>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>
                                                    No.
                                                </th>
                                                <th>Produk</th>
                                                <th>Kategori</th>
                                                <th className="text-center">
                                                    Stok
                                                </th>
                                                <th className="text-end">
                                                    HPP (WAC)
                                                </th>
                                                <th className="text-end">
                                                    Harga Jual (base)
                                                </th>
                                                <th className="text-end">
                                                    Nilai Modal
                                                </th>
                                                <th className="text-center">
                                                    Status
                                                </th>
                                                <th className="text-center">
                                                    Terakhir Keluar
                                                </th>
                                                <th>Pergerakan Terakhir</th>
                                                <th
                                                    className="text-center"
                                                    style={{ width: "16%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {products.data.length > 0 ? (
                                                products.data.map(
                                                    (product, index) => {
                                                        const badge =
                                                            getStockBadge(
                                                                product.stock,
                                                                Number(
                                                                    filters.low_threshold,
                                                                ),
                                                            );

                                                        const canViewMovement =
                                                            hasAnyPermission(
                                                                [
                                                                    "stock_movements.index",
                                                                ],
                                                                permissions,
                                                            );
                                                        const canAdjustStock =
                                                            hasAnyPermission(
                                                                [
                                                                    "stock_movements.create",
                                                                ],
                                                                permissions,
                                                            );

                                                        return (
                                                            <tr
                                                                key={product.id}
                                                            >
                                                                <td className="fw-bold text-center">
                                                                    {index +
                                                                        1 +
                                                                        (products.current_page -
                                                                            1) *
                                                                            products.per_page}
                                                                </td>
                                                                <td>
                                                                    <div className="fw-bold text-primary">
                                                                        {
                                                                            product.title
                                                                        }
                                                                    </div>
                                                                    <small className="text-muted">
                                                                        {product.barcode ||
                                                                            "-"}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    {product
                                                                        .category
                                                                        ?.name ||
                                                                        "-"}
                                                                </td>
                                                                <td className="text-center fw-bold">
                                                                    {
                                                                        product.stock
                                                                    }{" "}
                                                                    <small className="text-muted">
                                                                        {product.unit ||
                                                                            "pcs"}
                                                                    </small>
                                                                </td>
                                                                <td className="text-end">
                                                                    {formatRupiah(
                                                                        product.avg_cost,
                                                                    )}
                                                                </td>
                                                                <td className="text-end">
                                                                    {formatRupiah(
                                                                        product.sell_price,
                                                                    )}
                                                                </td>
                                                                <td className="text-end fw-bold text-success">
                                                                    {formatRupiah(
                                                                        product.inventory_cost_value,
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    {product.is_dead_stock && (
                                                                        <span className="badge bg-dark shadow-sm ms-1">Dead</span>
                                                                    )}
                                                                    {product.needs_reorder && (
                                                                        <span className="badge bg-warning text-dark shadow-sm ms-1">Reorder</span>
                                                                    )}
                                                                    <span
                                                                        className={
                                                                            badge.className
                                                                        }
                                                                    >
                                                                        {
                                                                            badge.label
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    {product.days_since_last_out === null
                                                                        ? product.stock > 0 ? (
                                                                            <span className="badge bg-dark shadow-sm">
                                                                                Belum pernah
                                                                            </span>
                                                                        ) : "-"
                                                                        : (
                                                                            <span
                                                                                className={`badge ${product.is_dead_stock ? "bg-dark" : product.days_since_last_out > 30 ? "bg-warning text-dark" : "bg-success"} shadow-sm`}
                                                                            >
                                                                                {product.days_since_last_out} hari
                                                                            </span>
                                                                        )
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {product.latest_movement ? (
                                                                        <>
                                                                            <div className="fw-bold">
                                                                                {
                                                                                    product
                                                                                        .latest_movement
                                                                                        .source_label
                                                                                }
                                                                                {product
                                                                                    .latest_movement
                                                                                    .type
                                                                                    ? ` / ${
                                                                                          movementTypeLabels[
                                                                                              product
                                                                                                  .latest_movement
                                                                                                  .type
                                                                                          ] ||
                                                                                          product
                                                                                              .latest_movement
                                                                                              .type
                                                                                      }`
                                                                                    : ""}
                                                                            </div>
                                                                            <small className="text-muted d-block">
                                                                                {formatDate(
                                                                                    product
                                                                                        .latest_movement
                                                                                        .created_at,
                                                                                )}
                                                                            </small>
                                                                            <small className="text-muted d-block">
                                                                                {product
                                                                                    .latest_movement
                                                                                    .user
                                                                                    ?.name ||
                                                                                    "-"}
                                                                            </small>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            Belum
                                                                            ada
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    {canViewMovement ||
                                                                    canAdjustStock ? (
                                                                        <div className="d-flex justify-content-center gap-2">
                                                                            {canViewMovement && (
                                                                                <Link
                                                                                    href={`/account/stock-movements?q=${encodeURIComponent(
                                                                                        product.barcode ||
                                                                                            product.title,
                                                                                    )}`}
                                                                                    className="btn btn-secondary btn-sm shadow-sm"
                                                                                >
                                                                                    <i className="fas fa-history me-1"></i>
                                                                                    Riwayat
                                                                                </Link>
                                                                            )}
                                                                            {canAdjustStock && (
                                                                                <Link
                                                                                    href={`/account/stock-movements/create?product_id=${product.id}`}
                                                                                    className="btn btn-primary btn-sm shadow-sm"
                                                                                >
                                                                                    <i className="fas fa-sliders-h me-1"></i>
                                                                                    Sesuaikan
                                                                                </Link>
                                                                            )}
                                                                        </div>
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
                                                        colSpan="11"
                                                        className="text-center py-4"
                                                    >
                                                        Belum ada data stok
                                                        untuk filter ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={products.links}
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
