import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";

export default function SupplierIndex() {
    const { suppliers, filters, flash, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};
    const [search, setSearch] = useState(filters.q || "");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get("/account/suppliers", { q: search });
    };

    const handleReset = () => {
        setSearch("");
        router.get("/account/suppliers");
    };

    return (
        <>
            <Head>
                <title>Supplier - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-truck me-2"></i>
                                    SUPPLIER
                                </h5>

                                {hasAnyPermission(
                                    ["suppliers.create"],
                                    permissions,
                                ) && (
                                    <Link
                                        href="/account/suppliers/create"
                                        className="btn btn-success shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-plus-circle me-2"></i>
                                        TAMBAH SUPPLIER
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

                                <form onSubmit={handleSearch} className="mb-3">
                                    <div className="row g-2">
                                        <div className="col-md-9">
                                            <input
                                                type="text"
                                                className="form-control border-0 shadow-sm"
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                placeholder="Cari nama supplier, telepon, atau email..."
                                            />
                                        </div>

                                        <div className="col-md-3 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary shadow-sm w-100"
                                            >
                                                <i className="fa fa-search me-2"></i>
                                                Cari
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-secondary shadow-sm w-100"
                                                onClick={handleReset}
                                            >
                                                <i className="fa fa-sync me-2"></i>
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
                                                <th>Nama Supplier</th>
                                                <th>Telepon</th>
                                                <th>Email</th>
                                                <th>Alamat</th>
                                                <th>Status</th>
                                                <th
                                                    className="text-center"
                                                    style={{ width: "15%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {suppliers.data.length > 0 ? (
                                                suppliers.data.map(
                                                    (supplier, index) => (
                                                        <tr key={supplier.id}>
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (suppliers.current_page -
                                                                        1) *
                                                                        suppliers.per_page}
                                                            </td>

                                                            <td className="fw-bold">
                                                                {supplier.name}
                                                            </td>

                                                            <td>
                                                                {supplier.no_telp ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {supplier.email ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {supplier.address ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`badge ${
                                                                        supplier.is_active
                                                                            ? "bg-success"
                                                                            : "bg-secondary"
                                                                    }`}
                                                                >
                                                                    {supplier.is_active
                                                                        ? "Aktif"
                                                                        : "Nonaktif"}
                                                                </span>
                                                            </td>

                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "suppliers.edit",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/suppliers/${supplier.id}/edit`}
                                                                        className="btn btn-primary btn-sm me-2 shadow-sm"
                                                                    >
                                                                        <i className="fa fa-pencil"></i>
                                                                    </Link>
                                                                )}

                                                                {hasAnyPermission(
                                                                    [
                                                                        "suppliers.delete",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Delete
                                                                        URL="/account/suppliers"
                                                                        id={
                                                                            supplier.id
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
                                                        colSpan="7"
                                                        className="text-center py-4"
                                                    >
                                                        Belum ada data supplier.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={suppliers.links}
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
