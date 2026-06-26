import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import Swal from "sweetalert2";
import getRoleLabel from "../../../Utils/role";

export default function UserEdit() {
    const { errors, roles, user } = usePage().props;

    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [rolesData, setRolesData] = useState(
        user.roles.map((obj) => obj.name),
    );

    const handleCheckboxChange = (e) => {
        let data = rolesData;

        if (e.target.checked) {
            data.push(e.target.value);
        } else {
            data.splice(data.indexOf(e.target.value), 1);
        }

        setRolesData([...data]);
    };

    const updateUser = async (e) => {
        e.preventDefault();

        router.put(
            `/account/users/${user.id}`,
            {
                name: name,
                email: email,
                password: password,
                password_confirmation: passwordConfirmation,
                roles: rolesData,
            },
            {
                onSuccess: () => {
                    Swal.fire({
                        title: "Berhasil!",
                        text: "Pengguna berhasil diperbarui.",
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
                <title>Edit Pengguna - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-user-edit me-2"></i>
                                    EDIT PENGGUNA
                                </h5>

                                <div>
                                    <Link
                                        href="/account/users"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-arrow-left me-2"></i>
                                        KEMBALI
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body">
                                <form onSubmit={updateUser}>
                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Nama Lengkap
                                            </label>

                                            <input
                                                type="text"
                                                className={`form-control ${
                                                    errors.name
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={name}
                                                onChange={(e) =>
                                                    setName(e.target.value)
                                                }
                                                placeholder="Masukkan nama lengkap"
                                            />

                                            {errors.name && (
                                                <div className="invalid-feedback">
                                                    {errors.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Alamat Email
                                            </label>

                                            <input
                                                type="email"
                                                className={`form-control ${
                                                    errors.email
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                placeholder="Masukkan alamat email"
                                            />

                                            {errors.email && (
                                                <div className="invalid-feedback">
                                                    {errors.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Kata Sandi
                                            </label>

                                            <input
                                                type="password"
                                                className={`form-control ${
                                                    errors.password
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                placeholder="Kosongkan jika tidak ingin diubah"
                                            />

                                            {errors.password && (
                                                <div className="invalid-feedback">
                                                    {errors.password}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Konfirmasi Kata Sandi
                                            </label>

                                            <input
                                                type="password"
                                                className="form-control"
                                                value={passwordConfirmation}
                                                onChange={(e) =>
                                                    setPasswordConfirmation(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Kosongkan jika tidak ingin diubah"
                                            />
                                        </div>
                                    </div>

                                    <hr />

                                    <div className="mb-3">
                                        <label className="fw-bold mb-3">
                                            Pilih Role
                                        </label>

                                        <div className="row">
                                            {roles.map((role, index) => (
                                                <div
                                                    className="col-12 col-md-4 col-lg-3 mb-2"
                                                    key={index}
                                                >
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            value={role.name}
                                                            onChange={
                                                                handleCheckboxChange
                                                            }
                                                            id={`role-${role.id}`}
                                                            defaultChecked={rolesData.some(
                                                                (name) =>
                                                                    name ===
                                                                    role.name,
                                                            )}
                                                        />

                                                        <label
                                                            className="form-check-label"
                                                            htmlFor={`role-${role.id}`}
                                                        >
                                                            {getRoleLabel(
                                                                role.name,
                                                            )}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {errors.roles && (
                                            <div className="alert alert-danger mt-3">
                                                {errors.roles}
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
