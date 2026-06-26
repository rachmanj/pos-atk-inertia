import React, { useRef, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function CategoryCreate() {
    const { errors = {} } = usePage().props;

    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const imageInputRef = useRef(null);

    const resetForm = () => {
        setName("");
        setImage(null);

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const storeCategory = (e) => {
        e.preventDefault();

        router.post(
            "/account/categories",
            {
                name: name,
                image: image,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    Swal.fire({
                        title: "Berhasil!",
                        text: "Kategori berhasil ditambahkan.",
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
                <title>Tambah Kategori - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-md-12 col-lg-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-folder-plus me-2"></i>
                                    TAMBAH KATEGORI
                                </h5>

                                <div>
                                    <Link
                                        href="/account/categories"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fas fa-arrow-left me-2"></i>
                                        KEMBALI
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body">
                                <form onSubmit={storeCategory}>
                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Nama Kategori
                                        </label>

                                        <input
                                            type="text"
                                            className={`form-control ${
                                                errors.name ? "is-invalid" : ""
                                            }`}
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            placeholder="Masukkan nama kategori"
                                        />

                                        {errors.name && (
                                            <div className="invalid-feedback">
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Gambar Kategori
                                        </label>

                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            className={`form-control ${
                                                errors.image ? "is-invalid" : ""
                                            }`}
                                            accept="image/jpeg,image/png,image/jpg"
                                            onChange={(e) =>
                                                setImage(
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />

                                        {errors.image ? (
                                            <div className="invalid-feedback">
                                                {errors.image}
                                            </div>
                                        ) : (
                                            <div className="form-text">
                                                Boleh dikosongkan. Format: JPG,
                                                JPEG, atau PNG maksimal 2MB.
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
