import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function PpobReport() {
    const {
        ppobData,
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
    const [groupBy, setGroupBy] = useState(filters.group_by || "product");

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/ppob", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId,
            group_by: groupBy,
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setCashierId("");
        setGroupBy("product");
        router.get("/account/reports/ppob");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/ppob", {
            q: search,
            start_date: start,
            end_date: end,
            cashier_id: cashierId,
            group_by: groupBy,
        });
    };

    return (
        <>
            <Head title="Laporan PPOB" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-mobile-alt me-2"></i>
                                    LAPORAN PPOB
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
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Cari produk PPOB..."
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <input
                                                type="date"
                                                className="form-control border-0 shadow-sm"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <input
                                                type="date"
                                                className="form-control border-0 shadow-sm"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={groupBy}
                                                onChange={(e) => setGroupBy(e.target.value)}
                                            >
                                                <option value="product">Group Produk</option>
                                                <option value="date">Group Tanggal</option>
                                            </select>
                                        </div>

                                        {isAdmin && (
                                            <div className="col-lg-3">
                                                <select
                                                    className="form-select border-0 shadow-sm"
                                                    value={cashierId}
                                                    onChange={(e) => setCashierId(e.target.value)}
                                                >
                                                    <option value="">Semua Kasir</option>
                                                    {cashiers.map((cashier) => (
                                                        <option key={cashier.id} value={cashier.id}>
                                                            {cashier.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="col-lg-2 d-flex gap-2">
                                            <button type="submit" className="btn btn-primary shadow-sm w-100">
                                                <i className="fas fa-filter me-2"></i>Filter
                                            </button>
                                            <button type="button" className="btn btn-secondary shadow-sm w-100" onClick={handleReset}>
                                                <i className="fas fa-sync-alt me-2"></i>Reset
                                            </button>
                                        </div>

                                        <div className="col-12">
                                            <DatePreset onApply={handleDatePreset} />
                                        </div>
                                    </div>
                                </form>

                                {/* Summary Cards */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Total Omzet PPOB</small>
                                            <h6 className="fw-bold text-success mb-1">{formatRupiah(summary.total_omzet)}</h6>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Total Admin Fee</small>
                                            <h6 className="fw-bold text-primary mb-1">{formatRupiah(summary.total_admin_fee)}</h6>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Total Modal (Cost)</small>
                                            <h6 className="fw-bold text-warning mb-1">{formatRupiah(summary.total_cost)}</h6>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Total Qty</small>
                                            <h6 className="fw-bold mb-1">{summary.total_qty}</h6>
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>No.</th>
                                                {groupBy === "date" && <th>Tanggal</th>}
                                                <th>Produk</th>
                                                <th className="text-center">Qty</th>
                                                <th className="text-end">Omzet</th>
                                                <th className="text-end">Admin Fee</th>
                                                <th className="text-end">Modal (Cost)</th>
                                                <th className="text-end">Laba</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ppobData.data.length > 0 ? (
                                                ppobData.data.map((item, index) => (
                                                    <tr key={`${item.product_id}-${item.sale_date ?? index}`}>
                                                        <td className="fw-bold text-center">
                                                            {index + 1 + (ppobData.current_page - 1) * ppobData.per_page}
                                                        </td>
                                                        {groupBy === "date" && <td>{item.sale_date}</td>}
                                                        <td className="fw-bold">{item.product?.title ?? "-"}</td>
                                                        <td className="text-center fw-bold">{item.total_qty}</td>
                                                        <td className="text-end text-success">{formatRupiah(item.total_omzet)}</td>
                                                        <td className="text-end text-primary">{formatRupiah(item.total_admin_fee)}</td>
                                                        <td className="text-end text-warning">{formatRupiah(item.total_cost)}</td>
                                                        <td className="text-end fw-bold text-success">{formatRupiah(item.total_laba)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={groupBy === "date" ? 8 : 7} className="text-center py-4">
                                                        Belum ada data penjualan PPOB untuk filter ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination links={ppobData.links} align="end" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}