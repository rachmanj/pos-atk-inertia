import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import Swal from "sweetalert2";
import ProductUnitBuilder from "../../../Components/ProductUnitBuilder";

export default function ProductCreate() {
    const { errors = {}, categories = [], units = [] } = usePage().props;

    const [barcode, setBarcode] = useState("");
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [image, setImage] = useState("");
    const [description, setDescription] = useState("");
    const [productType, setProductType] = useState("physical");
    const [openingBuyPrice, setOpeningBuyPrice] = useState("");
    const [stock, setStock] = useState("");
    const [productUnits, setProductUnits] = useState([
        { unit_id: units[0]?.id ? String(units[0].id) : "", conversion_factor: 1, sell_price: 0, is_base_unit: true, is_default_sell: true },
    ]);

    const isPhysical = productType === "physical";

    const storeProduct = (e) => {
        e.preventDefault();

        const payload = {
                barcode: barcode,
                title: title,
                category_id: categoryId,
                description: description,
                product_type: productType,
                buy_price: isPhysical ? openingBuyPrice : 0,
                stock: isPhysical ? stock : 0,
                product_units: JSON.stringify(productUnits.map((row) => ({
                    ...row,
                    unit_id: Number(row.unit_id),
                    conversion_factor: Number(row.conversion_factor),
                    sell_price: Number(row.sell_price || 0),
                }))),
            };

        if (image instanceof File) {
            payload.image = image;
        }

        router.post(
            "/account/products",
            payload,
            {
                forceFormData: image instanceof File,
                onSuccess: () => {
                    Swal.fire({
                        title: "Berhasil!",
                        text: "Data berhasil disimpan!",
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
                <title>Tambah Produk - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-cube me-2"></i>
                                    TAMBAH PRODUK
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
                                <form onSubmit={storeProduct}>
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
                                                value={categoryId}
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
                                                <span className="text-muted fw-normal"> (Opsional)</span>
                                            </label>

                                            <input
                                                type="file"
                                                className={`form-control ${
                                                    errors.image
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                onChange={(e) =>
                                                    setImage(e.target.files[0])
                                                }
                                                accept="image/*"
                                            />

                                            {errors.image && (
                                                <div className="invalid-feedback">
                                                    {errors.image}
                                                </div>
                                            )}
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
                                            <ProductUnitBuilder
                                                units={units}
                                                rows={productUnits}
                                                onChange={setProductUnits}
                                                errors={errors}
                                            />

                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="fw-bold mb-2">
                                                        Harga Beli Awal
                                                        <span className="text-muted fw-normal"> (satuan dasar)</span>
                                                    </label>

                                                    <div className="input-group">
                                                        <span className="input-group-text">
                                                            Rp
                                                        </span>

                                                        <input
                                                            type="number"
                                                            className={`form-control ${
                                                                errors.buy_price
                                                                    ? "is-invalid"
                                                                    : ""
                                                            }`}
                                                            value={openingBuyPrice}
                                                            onChange={(e) =>
                                                                setOpeningBuyPrice(
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="0"
                                                        />
                                                    </div>

                                                    <small className="d-block mt-1 text-muted">
                                                        Modal per satuan dasar untuk stok awal. Setelah ada pembelian, HPP mengikuti rata-rata tertimbang (WAC).
                                                    </small>

                                                    {errors.buy_price && (
                                                        <div className="text-danger small mt-1">
                                                            {errors.buy_price}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="fw-bold mb-2">Stok Awal</label>
                                                    <input type="number" min="0" className={`form-control ${errors.stock ? "is-invalid" : ""}`} value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
                                                    <small className="d-block mt-1">Stok awal akan otomatis tercatat ke histori mutasi stok.</small>
                                                    {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="alert alert-info mb-4">
                                                Produk PPOB tidak memerlukan harga beli/jual di katalog. Harga modal dan admin fee diinput saat penjualan di POS.
                                            </div>
                                            <div className="alert alert-info">Produk PPOB tidak menggunakan stok.</div>
                                        </>
                                    )}

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
                                            SIMPAN
                                        </button>

                                        <button
                                            type="reset"
                                            className="btn btn-warning shadow-sm rounded-sm ms-2 text-white"
                                        >
                                            <i className="fa fa-redo me-2"></i>
                                            ULANGI
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
