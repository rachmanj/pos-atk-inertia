import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export default function ExpenseReport() {
    const {
        expenses,
        byCategory = [],
        byMonth = [],
        summary,
        filters = {},
        categoryList = [],
        cashiers = [],
        isAdmin = false,
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [category, setCategory] = useState(filters.category || "");
    const [cashierId, setCashierId] = useState(filters.cashier_id || "");

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/expense", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            category: category,
            cashier_id: cashierId,
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setCategory("");
        setCashierId("");
        router.get("/account/reports/expense");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/expense", {
            q: search,
            start_date: start,
            end_date: end,
            category: category,
            cashier_id: cashierId,
        });
    };

    const formatChartRupiah = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value;
    };

    return (
        <>
            <Head title="Laporan Pengeluaran" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-receipt me-2"></i>
                                    LAPORAN PENGELUARAN
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
                                                placeholder="Cari pengeluaran..."
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
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                            >
                                                <option value="">Semua Kategori</option>
                                                {categoryList.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {isAdmin && (
                                            <div className="col-lg-3">
                                                <select
                                                    className="form-select border-0 shadow-sm"
                                                    value={cashierId}
                                                    onChange={(e) => setCashierId(e.target.value)}
                                                >
                                                    <option value="">Semua Staff</option>
                                                    {cashiers.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
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
                                    <div className="col-md-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Total Pengeluaran</small>
                                            <h6 className="fw-bold text-danger mb-1">{formatRupiah(summary.total_amount)}</h6>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Jumlah Transaksi</small>
                                            <h6 className="fw-bold mb-1">{summary.total_count}</h6>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">Rata-rata per Transaksi</small>
                                            <h6 className="fw-bold mb-1">{formatRupiah(summary.avg_per_transaction)}</h6>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="border rounded-3 p-3">
                                            <h6 className="fw-bold mb-3">
                                                <i className="fas fa-tags me-2"></i>
                                                Pengeluaran per Kategori
                                            </h6>
                                            {byCategory.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <BarChart data={byCategory} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis type="number" tickFormatter={formatChartRupiah} />
                                                        <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                                                        <Tooltip
                                                            formatter={(value) => [
                                                                formatRupiah(value),
                                                                "Total",
                                                            ]}
                                                        />
                                                        <Bar dataKey="total_amount" fill="#dc3545" name="Total" radius={[0, 4, 4, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <p className="text-muted text-center py-4">Belum ada data.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="border rounded-3 p-3">
                                            <h6 className="fw-bold mb-3">
                                                <i className="fas fa-calendar-alt me-2"></i>
                                                Tren Bulanan
                                            </h6>
                                            {byMonth.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <BarChart data={byMonth}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                                        <YAxis tickFormatter={formatChartRupiah} />
                                                        <Tooltip
                                                            formatter={(value) => [
                                                                formatRupiah(value),
                                                                "Total",
                                                            ]}
                                                        />
                                                        <Bar dataKey="total_amount" fill="#fd7e14" name="Total" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <p className="text-muted text-center py-4">Belum ada data.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Table */}
                                <h6 className="fw-bold mb-3">
                                    <i className="fas fa-list me-2"></i>
                                    Detail Pengeluaran
                                </h6>
                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>No.</th>
                                                <th>Kode</th>
                                                <th>Tanggal</th>
                                                <th>Kategori</th>
                                                <th>Judul</th>
                                                <th>Staff</th>
                                                <th className="text-end">Jumlah</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenses.data.length > 0 ? (
                                                expenses.data.map((expense, index) => (
                                                    <tr key={expense.id}>
                                                        <td className="fw-bold text-center">
                                                            {index + 1 + (expenses.current_page - 1) * expenses.per_page}
                                                        </td>
                                                        <td className="text-primary">{expense.code}</td>
                                                        <td>{expense.expense_date}</td>
                                                        <td>
                                                            <span className="badge bg-secondary shadow-sm">{expense.category}</span>
                                                        </td>
                                                        <td className="fw-bold">{expense.title}</td>
                                                        <td>{expense.user?.name ?? "-"}</td>
                                                        <td className="text-end text-danger fw-bold">{formatRupiah(expense.amount)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4">
                                                        Belum ada data pengeluaran untuk filter ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination links={expenses.links} align="end" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}