import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import getRoleLabel from "../../../Utils/role";

export default function UserIndex() {
    const { users, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};

    return (
        <>
            <Head>
                <title>Pengguna - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-md-12 col-lg-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-users me-2"></i>
                                    PENGGUNA
                                </h5>

                                <div>
                                    {hasAnyPermission(
                                        ["users.create"],
                                        permissions,
                                    ) && (
                                        <Link
                                            href="/account/users/create"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fas fa-plus-circle me-2"></i>
                                            TAMBAH PENGGUNA
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="mb-3">
                                    <Search URL="/account/users" />
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-bordered table-centered table-nowrap mb-0 rounded">
                                        <thead className="thead-dark text-white bg-dark">
                                            <tr className="border-0">
                                                <th
                                                    className="border-0"
                                                    style={{ width: "5%" }}
                                                >
                                                    No.
                                                </th>
                                                <th className="border-0">
                                                    Nama Pengguna
                                                </th>
                                                <th className="border-0">
                                                    Username
                                                </th>
                                                <th className="border-0">
                                                    Alamat Email
                                                </th>
                                                <th
                                                    className="border-0"
                                                    style={{ width: "20%" }}
                                                >
                                                    Role
                                                </th>
                                                <th
                                                    className="border-0"
                                                    style={{ width: "15%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {users.data.length > 0 ? (
                                                users.data.map(
                                                    (user, index) => (
                                                        <tr key={user.id}>
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (users.current_page -
                                                                        1) *
                                                                        users.per_page}
                                                            </td>

                                                            <td>{user.name}</td>

                                                            <td>{user.username}</td>

                                                            <td>
                                                                {user.email}
                                                            </td>

                                                            <td>
                                                                {user.roles.map(
                                                                    (role) => (
                                                                        <span
                                                                            key={
                                                                                role.id
                                                                            }
                                                                            className="badge bg-primary me-2 shadow-sm"
                                                                        >
                                                                            {getRoleLabel(
                                                                                role.name,
                                                                            )}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </td>

                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "users.edit",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/users/${user.id}/edit`}
                                                                        className="btn btn-primary btn-sm me-2 shadow-sm"
                                                                    >
                                                                        <i className="fas fa-pencil-alt"></i>
                                                                    </Link>
                                                                )}

                                                                {hasAnyPermission(
                                                                    [
                                                                        "users.delete",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Delete
                                                                        URL="/account/users"
                                                                        id={
                                                                            user.id
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
                                                        colSpan="6"
                                                        className="text-center py-4"
                                                    >
                                                        Data belum tersedia!
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={users.links}
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
