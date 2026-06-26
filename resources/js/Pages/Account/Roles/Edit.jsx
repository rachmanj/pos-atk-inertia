import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import Swal from "sweetalert2";
import getRoleLabel from "../../../Utils/role";

export default function RoleEdit() {
    const {
        errors = {},
        permissions = [],
        role,
        isSystemRole = false,
    } = usePage().props;

    const [name, setName] = useState(role.name);
    const [permissionsData, setPermissionsData] = useState(
        role.permissions.map((permission) => permission.name),
    );

    const handleCheckboxChange = (e) => {
        const value = e.target.value;

        if (e.target.checked) {
            setPermissionsData((prev) => [...prev, value]);
        } else {
            setPermissionsData((prev) =>
                prev.filter((permission) => permission !== value),
            );
        }
    };

    const updateRole = (e) => {
        e.preventDefault();

        router.put(
            `/account/roles/${role.id}`,
            {
                name: name,
                permissions: permissionsData,
            },
            {
                onSuccess: () => {
                    Swal.fire({
                        title: "Berhasil!",
                        text: "Role berhasil diperbarui.",
                        icon: "success",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                },
            },
        );
    };

    return (
        <>
            <Head>
                <title>Edit Role - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-md-12 col-lg-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-shield-alt me-2"></i>
                                    EDIT ROLE
                                </h5>

                                <div>
                                    <Link
                                        href="/account/roles"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-arrow-left me-2"></i>
                                        KEMBALI
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body">
                                <form onSubmit={updateRole}>
                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Nama Role
                                        </label>

                                        <input
                                            type="text"
                                            className={`form-control ${
                                                errors.name ? "is-invalid" : ""
                                            }`}
                                            value={
                                                isSystemRole
                                                    ? getRoleLabel(name)
                                                    : name
                                            }
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            placeholder="Masukkan nama role"
                                            disabled={isSystemRole}
                                        />

                                        {errors.name && (
                                            <div className="invalid-feedback">
                                                {errors.name}
                                            </div>
                                        )}

                                        {isSystemRole && (
                                            <small className="text-muted">
                                                Nama database: {name}. Role
                                                sistem dikunci agar konsisten.
                                            </small>
                                        )}
                                    </div>

                                    <hr />

                                    <div className="mb-3">
                                        <label className="fw-bold mb-3">
                                            Hak Akses
                                        </label>

                                        <div className="row">
                                            {permissions.map((permission) => (
                                                <div
                                                    className="col-12 col-md-4 col-lg-3 mb-2"
                                                    key={permission.id}
                                                >
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            value={
                                                                permission.name
                                                            }
                                                            checked={permissionsData.includes(
                                                                permission.name,
                                                            )}
                                                            onChange={
                                                                handleCheckboxChange
                                                            }
                                                            id={`check-${permission.id}`}
                                                        />

                                                        <label
                                                            className="form-check-label"
                                                            htmlFor={`check-${permission.id}`}
                                                        >
                                                            {permission.name}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {errors.permissions && (
                                            <div className="alert alert-danger mt-3">
                                                {errors.permissions}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fa fa-save me-2"></i>
                                            PERBARUI
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
