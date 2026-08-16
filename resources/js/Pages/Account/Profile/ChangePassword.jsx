import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router } from "@inertiajs/react";
import { notification } from "antd";
import { KeyOutlined, SaveOutlined } from "@ant-design/icons";

export default function ChangePassword() {
    const { errors = {} } = usePage().props;

    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const updatePassword = (e) => {
        e.preventDefault();

        router.put(
            "/account/password",
            {
                current_password: currentPassword,
                password: password,
                password_confirmation: passwordConfirmation,
            },
            {
                onSuccess: () => {
                    setCurrentPassword("");
                    setPassword("");
                    setPasswordConfirmation("");

                    notification.success({
                        message: "Berhasil!",
                        description: "Kata sandi berhasil diperbarui.",
                        duration: 1.5,
                    });
                },
            },
        );
    };

    return (
        <>
            <Head title="Ubah Kata Sandi - VASIA Stationery" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-lg-6">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 fw-bold">
                                    <KeyOutlined className="me-2" />
                                    UBAH KATA SANDI
                                </h5>
                            </div>

                            <div className="card-body">
                                <form onSubmit={updatePassword}>
                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Kata Sandi Saat Ini
                                        </label>

                                        <input
                                            type="password"
                                            className={`form-control ${
                                                errors.current_password
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={currentPassword}
                                            onChange={(e) =>
                                                setCurrentPassword(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Masukkan kata sandi saat ini"
                                            autoComplete="current-password"
                                        />

                                        {errors.current_password && (
                                            <div className="invalid-feedback">
                                                {errors.current_password}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Kata Sandi Baru
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
                                            placeholder="Masukkan kata sandi baru"
                                            autoComplete="new-password"
                                        />

                                        {errors.password && (
                                            <div className="invalid-feedback">
                                                {errors.password}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Konfirmasi Kata Sandi Baru
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
                                            placeholder="Ulangi kata sandi baru"
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-success shadow-sm rounded-sm"
                                    >
                                        <SaveOutlined className="me-2" />
                                        SIMPAN KATA SANDI
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
