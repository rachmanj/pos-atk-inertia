import React, { useEffect, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";

export default function StockMovementCreate() {
    const {
        products = [],
        selectedProductId,
        errors = {},
        flash = {},
    } = usePage().props;

    const fallbackProductId = products[0]?.id ? String(products[0].id) : "";

    const [productId, setProductId] = useState(
        selectedProductId ? String(selectedProductId) : fallbackProductId,
    );
    const [targetStock, setTargetStock] = useState("");
    const [note, setNote] = useState("");

    useEffect(() => {
        const nextProductId = selectedProductId
            ? String(selectedProductId)
            : fallbackProductId;

        setProductId(nextProductId);
        setTargetStock("");
        setNote("");
    }, [selectedProductId, fallbackProductId]);

    const selectedProduct = products.find(
        (product) => String(product.id) === String(productId),
    );

    const currentStock = Number(selectedProduct?.stock ?? 0);
    const unit = selectedProduct?.unit || "pcs";
    const targetStockNumber = Number(targetStock);
    const hasTargetStock =
        targetStock !== "" && !Number.isNaN(targetStockNumber);
    const estimatedStock = hasTargetStock
        ? Math.max(0, targetStockNumber)
        : null;
    const correctionQty = hasTargetStock
        ? Math.abs(estimatedStock - currentStock)
        : 0;
    const hasStockChange = hasTargetStock && estimatedStock !== currentStock;
    const correctionLabel = !hasTargetStock
        ? "Isi stok target"
        : !hasStockChange
          ? "Belum ada perubahan"
          : estimatedStock > currentStock
            ? "Koreksi tambah"
            : "Koreksi kurang";

    const storeMovement = (e) => {
        e.preventDefault();

        if (!selectedProduct || !hasStockChange) {
            return;
        }

        router.post("/account/stock-movements", {
            product_id: productId,
            type: "adjustment",
            target_stock: targetStock,
            note: note,
        });
    };

    return (
        <>
            <Head>
                <title>Koreksi Stok - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-xl-10 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-layer-group me-2"></i>
                                    KOREKSI STOK
                                </h5>

                                <div>
                                    <Link
                                        href="/account/stock-movements"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-arrow-left me-2"></i>
                                        KEMBALI
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body">
                                {flash.error && (
                                    <div className="alert alert-danger shadow-sm">
                                        {flash.error}
                                    </div>
                                )}

                                {products.length === 0 && (
                                    <div className="alert alert-warning shadow-sm">
                                        Belum ada produk. Tambahkan produk
                                        terlebih dahulu sebelum membuat koreksi
                                        stok.
                                    </div>
                                )}

                                <form onSubmit={storeMovement}>
                                    <div className="row">
                                        <div className="col-lg-7">
                                            <div className="mb-4">
                                                <label className="fw-bold mb-2">
                                                    Produk
                                                </label>

                                                <select
                                                    className={`form-select ${
                                                        errors.product_id
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    value={productId}
                                                    onChange={(e) => {
                                                        setProductId(
                                                            e.target.value,
                                                        );
                                                        setTargetStock("");
                                                    }}
                                                    disabled={
                                                        products.length === 0
                                                    }
                                                >
                                                    {products.map((product) => (
                                                        <option
                                                            key={product.id}
                                                            value={product.id}
                                                        >
                                                            {product.title} -{" "}
                                                            {product.barcode}
                                                        </option>
                                                    ))}
                                                </select>

                                                {errors.product_id && (
                                                    <div className="invalid-feedback">
                                                        {errors.product_id}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <label className="fw-bold mb-2">
                                                    Stok Fisik / Target
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    className={`form-control ${
                                                        errors.target_stock
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    value={targetStock}
                                                    onChange={(e) =>
                                                        setTargetStock(
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={!selectedProduct}
                                                    placeholder="Masukkan stok fisik/target"
                                                />

                                                {errors.target_stock && (
                                                    <div className="invalid-feedback">
                                                        {errors.target_stock}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <label className="fw-bold mb-2">
                                                    Catatan
                                                </label>

                                                <textarea
                                                    className={`form-control ${
                                                        errors.note
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    rows="4"
                                                    value={note}
                                                    onChange={(e) =>
                                                        setNote(e.target.value)
                                                    }
                                                    placeholder="Contoh: barang rusak, selisih hitung fisik kecil, koreksi input stok awal"
                                                    disabled={!selectedProduct}
                                                />

                                                {errors.note && (
                                                    <div className="invalid-feedback">
                                                        {errors.note}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn btn-success shadow-sm rounded-sm"
                                                disabled={
                                                    !selectedProduct ||
                                                    !hasStockChange
                                                }
                                            >
                                                <i className="fa fa-save me-2"></i>
                                                SIMPAN KOREKSI
                                            </button>
                                        </div>

                                        <div className="col-lg-5">
                                            <div className="border bg-light shadow-sm rounded-3 p-3">
                                                <div>
                                                    <h6 className="fw-bold mb-3">
                                                        PRATINJAU STOK
                                                    </h6>

                                                    <div className="mb-3">
                                                        <small className="d-block mb-1">
                                                            Produk
                                                        </small>

                                                        <div className="fw-bold">
                                                            {selectedProduct?.title ||
                                                                "-"}
                                                        </div>

                                                        <small>
                                                            {selectedProduct?.barcode ||
                                                                "-"}
                                                        </small>
                                                    </div>

                                                    <div className="row g-3">
                                                        <div className="col-6">
                                                            <div className="border rounded-3 p-3 bg-white text-dark h-100">
                                                                <small className="d-block mb-1">
                                                                    Stok Sistem
                                                                </small>

                                                                <div className="fw-bold fs-4">
                                                                    {
                                                                        currentStock
                                                                    }
                                                                </div>

                                                                <small>
                                                                    {unit}
                                                                </small>
                                                            </div>
                                                        </div>

                                                        <div className="col-6">
                                                            <div className="border rounded-3 p-3 bg-white text-dark h-100">
                                                                <small className="d-block mb-1">
                                                                    Estimasi
                                                                    Setelah
                                                                </small>

                                                                <div className="fw-bold fs-4 text-success">
                                                                    {hasTargetStock
                                                                        ? estimatedStock
                                                                        : "-"}
                                                                </div>

                                                                <small>
                                                                    {unit}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 border rounded-3 p-3 bg-white text-dark">
                                                        <small className="d-block mb-1">
                                                            Jenis Koreksi
                                                        </small>

                                                        <div className="fw-bold">
                                                            {correctionLabel}
                                                        </div>

                                                        <small>
                                                            Selisih:{" "}
                                                            {correctionQty}{" "}
                                                            {unit}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
