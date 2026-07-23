import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import {
    AuditOutlined,
    EyeOutlined,
    FilterOutlined,
    PlusCircleOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

const differenceClass = (difference) => {
    if (difference > 0) {
        return "text-success";
    }

    if (difference < 0) {
        return "text-danger";
    }

    return "text-secondary";
};

export default function StockOpnameIndex() {
    const {
        stockOpnames,
        filters = {},
        flash = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/stock-opnames", {
            q: search,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleReset = () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const formatDate = (date) =>
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                2,
                "0",
            )}-${String(date.getDate()).padStart(2, "0")}`;

        setSearch("");
        setStartDate(formatDate(monthStart));
        setEndDate(formatDate(now));

        router.get("/account/stock-opnames");
    };

    return (
        <>
            <Head>
                <title>Stock Opname - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <AuditOutlined className="me-2" />
                                    STOCK OPNAME
                                </h5>

                                {hasAnyPermission(
                                    ["stock_opnames.create"],
                                    permissions,
                                ) && (
                                    <Link
                                        href="/account/stock-opnames/create"
                                        className="btn btn-success shadow-sm rounded-sm"
                                    >
                                        <PlusCircleOutlined className="me-2" />
                                        BUAT OPNAME
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
                                        <div className="col-md-5">
                                            <input
                                                type="text"
                                                className="form-control shadow-sm"
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                placeholder="Cari kode opname, catatan, atau pengguna..."
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <input
                                                type="date"
                                                className="form-control shadow-sm"
                                                value={startDate}
                                                onChange={(e) =>
                                                    setStartDate(e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <input
                                                type="date"
                                                className="form-control shadow-sm"
                                                value={endDate}
                                                onChange={(e) =>
                                                    setEndDate(e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="col-md-3 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary shadow-sm w-100"
                                            >
                                                <FilterOutlined className="me-2" />
                                                Terapkan
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-secondary shadow-sm w-100"
                                                onClick={handleReset}
                                            >
                                                <ReloadOutlined className="me-2" />
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
                                                <th>Kode</th>
                                                <th>Tanggal</th>
                                                <th>Pemeriksa</th>
                                                <th className="text-center">
                                                    Item
                                                </th>
                                                <th className="text-center">
                                                    Total Selisih
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
                                            {stockOpnames.data.length > 0 ? (
                                                stockOpnames.data.map(
                                                    (stockOpname, index) => (
                                                        <tr
                                                            key={stockOpname.id}
                                                        >
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (stockOpnames.current_page -
                                                                        1) *
                                                                        stockOpnames.per_page}
                                                            </td>

                                                            <td className="fw-bold text-primary">
                                                                {
                                                                    stockOpname.code
                                                                }
                                                            </td>

                                                            <td>
                                                                {new Date(
                                                                    stockOpname.opname_date,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                )}
                                                            </td>

                                                            <td>
                                                                {stockOpname
                                                                    .user
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>

                                                            <td className="text-center fw-bold">
                                                                {
                                                                    stockOpname.total_items
                                                                }
                                                            </td>

                                                            <td
                                                                className={`text-center fw-bold ${differenceClass(
                                                                    stockOpname.total_difference_qty,
                                                                )}`}
                                                            >
                                                                {stockOpname.total_difference_qty >
                                                                0
                                                                    ? `+${stockOpname.total_difference_qty}`
                                                                    : stockOpname.total_difference_qty}
                                                            </td>

                                                            <td>
                                                                {stockOpname.note ||
                                                                    "-"}
                                                            </td>

                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "stock_opnames.show",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/stock-opnames/${stockOpname.code}`}
                                                                        className="btn btn-secondary btn-sm shadow-sm"
                                                                    >
                                                                        <EyeOutlined className="me-1" />
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
                                                        colSpan="8"
                                                        className="text-center py-4"
                                                    >
                                                        Belum ada data stock
                                                        opname.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={stockOpnames.links}
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
