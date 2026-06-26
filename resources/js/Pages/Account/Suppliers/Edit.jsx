import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function SupplierEdit() {
    const { errors = {}, supplier } = usePage().props;

    const [name, setName] = useState(supplier.name);
    const [phone, setPhone] = useState(supplier.no_telp || "");
    const [email, setEmail] = useState(supplier.email || "");
    const [address, setAddress] = useState(supplier.address || "");
    const [note, setNote] = useState(supplier.note || "");
    const [isActive, setIsActive] = useState(Boolean(supplier.is_active));

    const updateSupplier = (e) => {
        e.preventDefault();

        router.put(
            `/account/suppliers/${supplier.id}`,
            {
                name,
                no_telp: phone,
                email,
                address,
                note,
                is_active: isActive,
            },
            {
                onSuccess: () => {
                    Swal.fire({
                        title: "Berhasil",
                        text: "Supplier berhasil diperbarui.",
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
                <title>Edit Supplier - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-truck me-2"></i>
                                    EDIT SUPPLIER
                                </h5>

                                <Link
                                    href="/account/suppliers"
                                    className="btn btn-secondary shadow-sm rounded-sm"
                                >
                                    <i className="fas fa-arrow-left me-2"></i>
                                    KEMBALI
                                </Link>
                            </div>

                            <div className="card-body">
                                <form onSubmit={updateSupplier}>
                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Nama Supplier
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
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
                                            />

                                            {errors.name && (
                                                <div className="invalid-feedback">
                                                    {errors.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Nomor Telepon
                                                <span className="text-danger ms-1">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                className={`form-control ${
                                                    errors.no_telp
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={phone}
                                                onChange={(e) =>
                                                    setPhone(e.target.value)
                                                }
                                            />

                                            {errors.no_telp && (
                                                <div className="invalid-feedback">
                                                    {errors.no_telp}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Email
                                        </label>

                                        <input
                                            type="email"
                                            className={`form-control ${
                                                errors.email ? "is-invalid" : ""
                                            }`}
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                        />

                                        {errors.email && (
                                            <div className="invalid-feedback">
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Alamat
                                            <span className="text-danger ms-1">
                                                *
                                            </span>
                                        </label>

                                        <textarea
                                            className={`form-control ${
                                                errors.address
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            rows="3"
                                            value={address}
                                            onChange={(e) =>
                                                setAddress(e.target.value)
                                            }
                                        ></textarea>

                                        {errors.address && (
                                            <div className="invalid-feedback">
                                                {errors.address}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Catatan
                                        </label>

                                        <textarea
                                            className={`form-control ${
                                                errors.note ? "is-invalid" : ""
                                            }`}
                                            rows="3"
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                        ></textarea>

                                        {errors.note && (
                                            <div className="invalid-feedback">
                                                {errors.note}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-check form-switch mb-4">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={(e) =>
                                                setIsActive(e.target.checked)
                                            }
                                            id="supplierEditActive"
                                        />

                                        <label
                                            className="form-check-label fw-bold"
                                            htmlFor="supplierEditActive"
                                        >
                                            Supplier aktif
                                        </label>
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fas fa-save me-2"></i>
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
