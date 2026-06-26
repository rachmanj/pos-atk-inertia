import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import Swal from "sweetalert2";
import hasAnyPermission from "../../../Utils/Permissions";

import ProductUnitBuilder from "../../../Components/ProductUnitBuilder";

export default function ProductEdit() {
    const { errors = {}, categories = [], product, units = [], auth } = usePage().props;
    const allPermissions = auth?.permissions ?? {};

    const [barcode, setBarcode] = useState(product.barcode);
    const [title, setTitle] = useState(product.title);
    const [categoryId, setCategoryId] = useState(product.category_id);
    const [image, setImage] = useState("");
    const [description, setDescription] = useState(product.description || "");
    const [productType, setProductType] = useState(product.product_type || "physical");
    const [productUnits, setProductUnits] = useState(
        (product.product_units || []).map((row) => ({
            unit_id: String(row.unit_id),
            conversion_factor: row.conversion_factor,
            sell_price: row.sell_price,
            is_base_unit: row.is_base_unit,
            is_default_sell: row.is_default_sell,
        })),
    );

    const isPhysical = productType === "physical";

    const updateProduct = (e) => {
        e.preventDefault();

        const data = {
            _method: "PUT",
            barcode: barcode,
            title: title,
            category_id: categoryId,
            description: description,
            product_type: productType,
            product_units: JSON.stringify(productUnits.map((row) => ({
                ...row,
                unit_id: Number(row.unit_id),
                conversion_factor: Number(row.conversion_factor),
                sell_price: Number(row.sell_price),
            }))),
        };

        const hasNewImage = image instanceof File;

        if (hasNewImage) {
            data.image = image;
        }

        router.post(`/account/products/${product.id}`, data, {
            forceFormData: hasNewImage,
            onSuccess: () => {
                Swal.fire({
                    title: "Berhasil!",
                    text: "Data berhasil diperbarui!",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                });
            },
        });
    };

    return (
        <>
            <Head>
                <title>Edit Produk - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i
                                        className="fa fa-cube me-2"
                                        aria-hidden="true"
                                    ></i>
                                    EDIT PRODUK
                                </h5>

                                <div>
                                    <Link
                                        href="/account/products"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-arrow-left me-2"></i>
                                        KEMBALI
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body">
                                <form onSubmit={updateProduct}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold mb-2">
                                                Barcode
                                            </label>

                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className={`form-control ${
                                                        errors.barcode
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    value={barcode}
                                                    onChange={(e) =>
                                                        setBarcode(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Masukkan barcode atau scan"
                                                />

                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        const randomBarcode =
                                                            Math.floor(
                                                                1000000000000 +
                                                                    Math.random() *
                                                                        9000000000000,
                                                            ).toString();

                                                        setBarcode(
                                                            randomBarcode,
                                                        );
                                                    }}
                                                >
                                                    <i className="fa fa-barcode me-1"></i>
                                                    Generate
                                                </button>
                                            </div>

                                            {errors.barcode && (
                                                <div className="text-danger small mt-1">
                                                    {errors.barcode}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold mb-2">
                                                Kategori
                                            </label>

                                            <select
                                                className={`form-select ${
                                                    errors.category_id
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={categoryId ?? ""}
                                                onChange={(e) =>
                                                    setCategoryId(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    -- Pilih Kategori --
                                                </option>

                                                {categories.map((category) => (
                                                    <option
                                                        key={category.id}
                                                        value={category.id}
                                                    >
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>

                                            {errors.category_id && (
                                                <div className="invalid-feedback">
                                                    {errors.category_id}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold mb-2">
                                                Nama Produk
                                            </label>

                                            <input
                                                type="text"
                                                className={`form-control ${
                                                    errors.title
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={title}
                                                onChange={(e) =>
                                                    setTitle(e.target.value)
                                                }
                                                placeholder="Masukkan nama produk"
                                            />

                                            {errors.title && (
                                                <div className="invalid-feedback">
                                                    {errors.title}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold mb-2">
                                                Gambar Produk
                                            </label>

                                            <input
                                                type="file"
                                                className={`form-control ${
                                                    errors.image
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                onChange={(e) =>
                                                    setImage(
                                                        e.target.files?.[0] ??
                                                            "",
                                                    )
                                                }
                                                accept="image/*"
                                            />

                                            <small className="mt-1 d-block">
                                                *Biarkan kosong jika tidak ingin
                                                mengubah gambar
                                            </small>

                                            {errors.image && (
                                                <div className="invalid-feedback">
                                                    {errors.image}
                                                </div>
                                            )}

                                            <div className="mt-2">
                                                <img
                                                    src={product.image}
                                                    alt="Produk Saat Ini"
                                                    width="80"
                                                    className="rounded-3 shadow-sm border"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold mb-2">Tipe Produk</label>
                                            <select className="form-select" value={productType} onChange={(e) => setProductType(e.target.value)}>
                                                <option value="physical">Fisik (Stok)</option>
                                                <option value="ppob">PPOB (Digital)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {isPhysical ? (
                                        <>
                                            <ProductUnitBuilder units={units} rows={productUnits} onChange={setProductUnits} errors={errors} />

                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <div className="border rounded-3 p-3 bg-light h-100">
                                                        <div className="fw-bold mb-2">Informasi Harga Modal</div>
                                                        <div className="small mb-1">
                                                            <span className="text-muted">HPP (WAC):</span>{" "}
                                                            <span className="fw-semibold">
                                                                Rp {Number(product.avg_cost || 0).toLocaleString("id-ID")}
                                                            </span>
                                                            <span className="text-muted"> / {product.unit}</span>
                                                        </div>
                                                        <div className="small">
                                                            <span className="text-muted">Harga beli terakhir:</span>{" "}
                                                            <span className="fw-semibold">
                                                                Rp {Number(product.buy_price || 0).toLocaleString("id-ID")}
                                                            </span>
                                                        </div>
                                                        <small className="d-block mt-2 text-muted">
                                                            HPP diperbarui otomatis dari pembelian. Harga jual diatur per satuan di tabel di atas.
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="alert alert-info mb-4">
                                            Produk PPOB tidak memerlukan harga beli/jual di katalog. Harga modal dan admin fee diinput saat penjualan di POS.
                                        </div>
                                    )}

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold mb-2">Stok</label>
                                            <div className="border rounded-3 p-3 bg-light h-100">
                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                    <div>
                                                        <div className="fw-bold fs-5">
                                                            {product.stock} {product.unit}
                                                        </div>

                                                        <small>
                                                            Perubahan stok
                                                            dicatat lewat
                                                            penyesuaian stok
                                                            agar histori tetap
                                                            rapi.
                                                        </small>
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        {hasAnyPermission(
                                                            [
                                                                "stock_movements.index",
                                                            ],
                                                            allPermissions,
                                                        ) && (
                                                            <Link
                                                                href={`/account/stock-movements?q=${encodeURIComponent(
                                                                    product.barcode,
                                                                )}`}
                                                                className="btn btn-dark btn-sm shadow-sm"
                                                            >
                                                                <i className="fa fa-history me-2"></i>
                                                                RIWAYAT
                                                            </Link>
                                                        )}

                                                        {hasAnyPermission(
                                                            [
                                                                "stock_movements.create",
                                                            ],
                                                            allPermissions,
                                                        ) && (
                                                            <Link
                                                                href={`/account/stock-movements/create?product_id=${product.id}`}
                                                                className="btn btn-warning btn-sm shadow-sm text-dark"
                                                            >
                                                                <i
                                                                    className="fa fa-exchange me-2"
                                                                    aria-hidden="true"
                                                                ></i>
                                                                SESUAIKAN
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {errors.stock && (
                                                <div className="invalid-feedback">
                                                    {errors.stock}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Deskripsi{" "}
                                            <span className="text-muted fw-normal">
                                                (Opsional)
                                            </span>
                                        </label>

                                        <textarea
                                            className={`form-control ${
                                                errors.description
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            rows="3"
                                            placeholder="Masukkan deskripsi produk"
                                        ></textarea>

                                        {errors.description && (
                                            <div className="invalid-feedback">
                                                {errors.description}
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
