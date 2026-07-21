import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function CustomerReport() {
    const {
        customers,
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
        router.get("/account/reports/customers", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId,
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setCashierId("");
        router.get("/account/reports/customers");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/customers", {
            q: search,
            start_date: start,
            end_date: end,
            cashier_id: cashierId,
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId,
        });
        window.location.href = `/account/reports/customers/export?${params.toString()}`;
    };

    const formatDate = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <>
            <Head title="Laporan Pelanggan" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-users me-2"></i>
                                    LAPORAN PELANGGAN
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
                                        <div className="col-lg-3">
                                            <input
                                                type="text"
                                                className="form-control border-0 shadow-sm"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Cari pelanggan (nama/no HP)..."
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
                                            <small className="text-muted">Total Pelanggan</small>
                                            <h6 className="fw-bold mb-1">{summary.total_customers}</h6>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Total Transaksi</small>
                                            <h6 className="fw-bold mb-1">{summary.total_transactions}</h6>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Total Omzet</small>
                                            <h6 className="fw-bold text-success mb-1">{formatRupiah(summary.total_omzet)}</h6>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Rata-rata per Pelanggan</small>
                                            <h6 className="fw-bold text-primary mb-1">{formatRupiah(summary.avg_per_customer)}</h6>
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>No.</th>
                                                <th>Pelanggan</th>
                                                <th>No HP</th>
                                                <th className="text-center">Total Transaksi</th>
                                                <th className="text-end">Omzet</th>
                                                <th className="text-end">Rata-rata</th>
                                                <th>Kunjungan Terakhir</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.data.length > 0 ? (
                                                customers.data.map((item, index) => (
                                                    <tr key={item.customer_id}>
                                                        <td className="fw-bold text-center">
                                                            {index + 1 + (customers.current_page - 1) * customers.per_page}
                                                        </td>
                                                        <td className="fw-bold">{item.customer?.name ?? "-"}</td>
                                                        <td>{item.customer?.no_telp ?? "-"}</td>
                                                        <td className="text-center fw-bold">{item.total_transactions}</td>
                                                        <td className="text-end text-success">{formatRupiah(item.total_omzet)}</td>
                                                        <td className="text-end text-primary">{formatRupiah(item.average_transaction)}</td>
                                                        <td>{formatDate(item.last_visit)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4">
                                                        Belum ada data pelanggan untuk filter ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination links={customers.links} align="end" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}