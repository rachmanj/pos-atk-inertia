import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import getRoleLabel from "../../../Utils/role";

export default function RoleIndex() {
    // destruct props dari Inertia
    const { roles, auth = {} } = usePage().props;

    // ambil semua permission user login
    const allPermissions = auth.permissions || {};

    return (
        <>
            <Head>
                <title>Role - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-md-12 col-lg-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i
                                        className="fas fa-shield me-2"
                                        aria-hidden="true"
                                    ></i>
                                    ROLE
                                </h5>

                                <div>
                                    {hasAnyPermission(
                                        ["roles.create"],
                                        allPermissions,
                                    ) && (
                                        <Link
                                            href="/account/roles/create"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fa fa-plus-circle me-2"></i>
                                            TAMBAH ROLE
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="mb-3">
                                    <Search URL="/account/roles" />
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
                                                    Nama Role
                                                </th>
                                                <th
                                                    className="border-0"
                                                    style={{ width: "60%" }}
                                                >
                                                    Hak Akses
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
                                            {roles.data.length > 0 ? (
                                                roles.data.map(
                                                    (role, index) => (
                                                        <tr key={role.id}>
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (roles.current_page -
                                                                        1) *
                                                                        roles.per_page}
                                                            </td>

                                                            <td>
                                                                <div className="fw-semibold">
                                                                    {getRoleLabel(
                                                                        role.name,
                                                                    )}
                                                                </div>

                                                                {role.is_system && (
                                                                    <small className="text-muted">
                                                                        Role
                                                                        sistem:{" "}
                                                                        {
                                                                            role.name
                                                                        }
                                                                    </small>
                                                                )}
                                                            </td>

                                                            <td>
                                                                {role.permissions.map(
                                                                    (
                                                                        permission,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                permission.id
                                                                            }
                                                                            className="badge bg-success me-2 mb-1 shadow-sm"
                                                                        >
                                                                            {
                                                                                permission.name
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </td>

                                                            <td className="text-center">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "roles.edit",
                                                                    ],
                                                                    allPermissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/roles/${role.id}/edit`}
                                                                        className="btn btn-primary btn-sm me-2 shadow-sm"
                                                                    >
                                                                        <i
                                                                            className="fa fa-pencil"
                                                                            aria-hidden="true"
                                                                        ></i>
                                                                    </Link>
                                                                )}

                                                                {hasAnyPermission(
                                                                    [
                                                                        "roles.delete",
                                                                    ],
                                                                    allPermissions,
                                                                ) &&
                                                                    !role.is_system && (
                                                                        <Delete
                                                                            URL="/account/roles"
                                                                            id={
                                                                                role.id
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
                                                        colSpan="4"
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
                                        links={roles.links}
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
