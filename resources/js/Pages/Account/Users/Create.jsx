import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import Swal from "sweetalert2";
import getRoleLabel from "../../../Utils/role";

export default function UserCreate() {
    const { errors = {}, roles = [] } = usePage().props;

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [rolesData, setRolesData] = useState([]);

    const handleCheckboxChange = (e) => {
        const value = e.target.value;

        if (e.target.checked) {
            setRolesData((prev) => [...prev, value]);
        } else {
            setRolesData((prev) => prev.filter((role) => role !== value));
        }
    };

    const resetForm = () => {
        setName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        setRolesData([]);
    };

    const storeUser = (e) => {
        e.preventDefault();

        router.post(
            "/account/users",
            {
                name: name,
                username: username,
                email: email,
                password: password,
                password_confirmation: passwordConfirmation,
                roles: rolesData,
            },
            {
                onSuccess: () => {
                    Swal.fire({
                        title: "Berhasil!",
                        text: "Pengguna berhasil ditambahkan.",
                        icon: "success",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                },
            }
        );
    };

    return (
        <>
            <Head>
                <title>Tambah Pengguna - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-user-plus me-2"></i>
                                    TAMBAH PENGGUNA
                                </h5>

                                <div>
                                    <Link
                                        href="/account/users"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fas fa-arrow-left me-2"></i>
                                        KEMBALI
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body">
                                <form onSubmit={storeUser}>
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
                                                Username
                                            </label>

                                            <input
                                                type="text"
                                                className={`form-control ${
                                                    errors.username
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={username}
                                                onChange={(e) =>
                                                    setUsername(e.target.value)
                                                }
                                                placeholder="Masukkan username"
                                            />

                                            {errors.username && (
                                                <div className="invalid-feedback">
                                                    {errors.username}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row">
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
                                                placeholder="Masukkan kata sandi"
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
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Masukkan konfirmasi kata sandi"
                                            />
                                        </div>
                                    </div>

                                    <hr />

                                    <div className="mb-3">
                                        <label className="fw-bold mb-3">
                                            Pilih Role
                                        </label>

                                        <div className="row">
                                            {roles.map((role) => (
                                                <div
                                                    className="col-12 col-md-4 col-lg-3 mb-2"
                                                    key={role.id}
                                                >
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            value={role.name}
                                                            checked={rolesData.includes(
                                                                role.name
                                                            )}
                                                            onChange={
                                                                handleCheckboxChange
                                                            }
                                                            id={`role-${role.id}`}
                                                        />

                                                        <label
                                                            className="form-check-label"
                                                            htmlFor={`role-${role.id}`}
                                                        >
                                                            {getRoleLabel(
                                                                role.name
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
                                            <i className="fas fa-save me-2"></i>
                                            SIMPAN
                                        </button>

                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="btn btn-warning shadow-sm rounded-sm ms-2 text-white"
                                        >
                                            <i className="fas fa-redo me-2"></i>
                                            ATUR ULANG
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