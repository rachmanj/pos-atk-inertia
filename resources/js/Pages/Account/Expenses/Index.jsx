import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

export default function ExpenseIndex() {
    const {
        expenses,
        summary = {},
        filters = {},
        categories = [],
        users = [],
        isAdmin = false,
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [category, setCategory] = useState(filters.category || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [userId, setUserId] = useState(filters.user_id || "");

    const categoryLabels = useMemo(() => {
        return categories.reduce((labels, item) => {
            labels[item.value] = item.label;
            return labels;
        }, {});
    }, [categories]);

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/expenses", {
            q: search,
            category,
            start_date: startDate,
            end_date: endDate,
            user_id: userId,
        });
    };

    const handleReset = () => {
        setSearch("");
        setCategory("");
        setStartDate("");
        setEndDate("");
        setUserId("");

        router.get("/account/expenses");
    };

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
            dateStyle: "medium",
        });
    };

    return (
        <>
            <Head title="Pengeluaran" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-money-bill-wave me-2"></i>
                                    PENGELUARAN
                                </h5>

                                {hasAnyPermission(
                                    ["expenses.create"],
                                    permissions,
                                ) && (
                                    <Link
                                        href="/account/expenses/create"
                                        className="btn btn-success shadow-sm rounded-sm"
                                    >
                                        <i className="fas fa-plus-circle me-2"></i>
                                        TAMBAH PENGELUARAN
                                    </Link>
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
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                placeholder="Cari kode, judul, atau catatan..."
                                            />
                                        </div>

                                        <div className="col-lg-2">
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={category}
                                                onChange={(e) =>
                                                    setCategory(e.target.value)
                                                }
                                            >
                                                <option value="">
                                                    Semua Kategori
                                                </option>
                                                {categories.map((item) => (
                                                    <option
                                                        key={item.value}
                                                        value={item.value}
                                                    >
                                                        {item.label}
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

                                        {isAdmin && (
                                            <div className="col-lg-2">
                                                <select
                                                    className="form-select border-0 shadow-sm"
                                                    value={userId}
                                                    onChange={(e) =>
                                                        setUserId(
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Semua User
                                                    </option>
                                                    {users.map((user) => (
                                                        <option
                                                            key={user.id}
                                                            value={user.id}
                                                        >
                                                            {user.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="col-lg-1 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary shadow-sm"
                                            >
                                                <i className="fas fa-filter"></i>
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-secondary shadow-sm"
                                                onClick={handleReset}
                                            >
                                                <i className="fas fa-sync-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Total Pengeluaran
                                            </small>
                                            <h6 className="fw-bold text-danger mb-0">
                                                {formatRupiah(
                                                    summary.total_amount || 0,
                                                )}
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Jumlah Data
                                            </small>
                                            <h6 className="fw-bold mb-0">
                                                {summary.total_expenses || 0}
                                            </h6>
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
                                                <th>Kode</th>
                                                <th>Tanggal</th>
                                                <th>Kategori</th>
                                                <th>Judul</th>
                                                <th>User</th>
                                                <th className="text-end">
                                                    Nominal
                                                </th>
                                                <th>Catatan</th>
                                                <th
                                                    className="text-center"
                                                    style={{ width: "12%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {expenses.data.length > 0 ? (
                                                expenses.data.map(
                                                    (expense, index) => (
                                                        <tr key={expense.id}>
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (expenses.current_page -
                                                                        1) *
                                                                        expenses.per_page}
                                                            </td>
                                                            <td className="fw-bold text-primary">
                                                                {expense.code}
                                                            </td>
                                                            <td>
                                                                {formatDate(
                                                                    expense.expense_date,
                                                                )}
                                                            </td>
                                                            <td>
                                                                {categoryLabels[
                                                                    expense
                                                                        .category
                                                                ] ||
                                                                    expense.category}
                                                            </td>
                                                            <td className="fw-bold">
                                                                {expense.title}
                                                            </td>
                                                            <td>
                                                                {expense.user
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>
                                                            <td className="text-end fw-bold text-danger">
                                                                {formatRupiah(
                                                                    expense.amount,
                                                                )}
                                                            </td>
                                                            <td>
                                                                {expense.note ||
                                                                    "-"}
                                                            </td>
                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "expenses.edit",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/expenses/${expense.id}/edit`}
                                                                        className="btn btn-primary btn-sm me-2 shadow-sm"
                                                                    >
                                                                        <i className="fas fa-pencil-alt"></i>
                                                                    </Link>
                                                                )}

                                                                {hasAnyPermission(
                                                                    [
                                                                        "expenses.delete",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Delete
                                                                        URL="/account/expenses"
                                                                        id={
                                                                            expense.id
                                                                        }
                                                                    />
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
                                                        Data pengeluaran belum
                                                        tersedia.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={expenses.links}
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
