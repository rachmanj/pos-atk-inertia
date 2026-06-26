import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";

const createEmptyItem = () => ({
    product_id: "",
    unit_id: "",
    conversion_factor: 1,
    qty: 1,
    buy_price: 0,
});

export default function PurchaseCreate() {
    const { errors, suppliers, products, defaultPurchaseDate } =
        usePage().props;

    const [supplierId, setSupplierId] = useState(
        suppliers[0]?.id ? String(suppliers[0].id) : "",
    );
    const [purchaseDate, setPurchaseDate] = useState(defaultPurchaseDate);
    const [note, setNote] = useState("");
    const [items, setItems] = useState([createEmptyItem()]);

    const productMap = useMemo(() => {
        return products.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});
    }, [products]);

    const isBuyPriceAboveSellPrice = (item) => {
        const selectedProduct = productMap[item.product_id];

        return (
            selectedProduct &&
            Number(item.buy_price || 0) >
                Number(selectedProduct.sell_price || 0)
        );
    };

    const canSubmit = suppliers.length > 0 && products.length > 0;

    const handleItemChange = (index, field, value) => {
        setItems((prevItems) =>
            prevItems.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                if (field === "product_id") {
                    const selectedProduct = productMap[value];
                    const defaultUnit = selectedProduct?.product_units?.find((u) => u.is_base_unit)
                        || selectedProduct?.product_units?.[0];

                    return {
                        ...item,
                        product_id: value,
                        unit_id: defaultUnit ? String(defaultUnit.unit_id) : "",
                        conversion_factor: defaultUnit ? Number(defaultUnit.conversion_factor) : 1,
                        buy_price: selectedProduct ? selectedProduct.buy_price : 0,
                    };
                }

                if (field === "unit_id") {
                    const selectedProduct = productMap[item.product_id];
                    const selectedUnit = selectedProduct?.product_units?.find((u) => String(u.unit_id) === String(value));

                    return {
                        ...item,
                        unit_id: value,
                        conversion_factor: selectedUnit ? Number(selectedUnit.conversion_factor) : 1,
                    };
                }

                return {
                    ...item,
                    [field]:
                        field === "qty" || field === "buy_price"
                            ? Number(value)
                            : value,
                };
            }),
        );
    };

    const addItem = () => {
        setItems((prevItems) => [...prevItems, createEmptyItem()]);
    };

    const removeItem = (index) => {
        setItems((prevItems) =>
            prevItems.length === 1
                ? prevItems
                : prevItems.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    const totalAmount = items.reduce((sum, item) => {
        return sum + Number(item.qty || 0) * Number(item.buy_price || 0);
    }, 0);

    const totalQty = items.reduce(
        (sum, item) => sum + Number(item.qty || 0),
        0,
    );

    const storePurchase = (e) => {
        e.preventDefault();

        router.post("/account/purchases", {
            supplier_id: supplierId,
            purchase_date: purchaseDate,
            note,
            items: items.map((item) => ({
                product_id: Number(item.product_id),
                unit_id: item.unit_id ? Number(item.unit_id) : null,
                conversion_factor: Number(item.conversion_factor || 1),
                qty: Number(item.qty),
                buy_price: Number(item.buy_price),
            })),
        });
    };

    return (
        <>
            <Head>
                <title>Tambah Pembelian - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-shopping-cart me-2"></i>
                                    TAMBAH PEMBELIAN
                                </h5>

                                <Link
                                    href="/account/purchases"
                                    className="btn btn-secondary shadow-sm rounded-sm"
                                >
                                    <i className="fas fa-arrow-left me-2"></i>
                                    KEMBALI
                                </Link>
                            </div>

                            <div className="card-body">
                                {!canSubmit && (
                                    <div className="alert alert-warning shadow-sm">
                                        {suppliers.length === 0 && (
                                            <div className="mb-2">
                                                Supplier belum tersedia.
                                                Tambahkan supplier terlebih
                                                dahulu.
                                                {hasAnyPermission([
                                                    "suppliers.create",
                                                ]) && (
                                                    <Link
                                                        href="/account/suppliers/create"
                                                        className="ms-2 fw-bold"
                                                    >
                                                        Tambah Supplier
                                                    </Link>
                                                )}
                                            </div>
                                        )}

                                        {products.length === 0 && (
                                            <div>
                                                Produk belum tersedia. Tambahkan
                                                produk terlebih dahulu.
                                                {hasAnyPermission([
                                                    "products.create",
                                                ]) && (
                                                    <Link
                                                        href="/account/products/create"
                                                        className="ms-2 fw-bold"
                                                    >
                                                        Tambah Produk
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {errors.items && (
                                    <div className="alert alert-danger shadow-sm">
                                        {errors.items}
                                    </div>
                                )}

                                <form onSubmit={storePurchase}>
                                    <div className="row">
                                        <div className="col-md-4 mb-4">
                                            <label className="fw-bold mb-2">
                                                Supplier
                                            </label>

                                            <select
                                                className={`form-select ${errors.supplier_id ? "is-invalid" : ""}`}
                                                value={supplierId}
                                                onChange={(e) =>
                                                    setSupplierId(
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!canSubmit}
                                            >
                                                <option value="">
                                                    Pilih Supplier
                                                </option>

                                                {suppliers.map((supplier) => (
                                                    <option
                                                        key={supplier.id}
                                                        value={supplier.id}
                                                    >
                                                        {supplier.name}
                                                        {supplier.no_telp
                                                            ? ` - ${supplier.no_telp}`
                                                            : ""}
                                                    </option>
                                                ))}
                                            </select>

                                            {errors.supplier_id && (
                                                <div className="invalid-feedback">
                                                    {errors.supplier_id}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-4 mb-4">
                                            <label className="fw-bold mb-2">
                                                Tanggal Pembelian
                                            </label>

                                            <input
                                                type="date"
                                                className={`form-control ${errors.purchase_date ? "is-invalid" : ""}`}
                                                value={purchaseDate}
                                                onChange={(e) =>
                                                    setPurchaseDate(
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!canSubmit}
                                            />

                                            {errors.purchase_date && (
                                                <div className="invalid-feedback">
                                                    {errors.purchase_date}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-4 mb-4">
                                            <label className="fw-bold mb-2">
                                                Ringkasan
                                            </label>

                                            <div className="border rounded-3 p-3 bg-light h-100">
                                                <div className="small">
                                                    Total Qty
                                                </div>
                                                <div className="fw-bold mb-2">
                                                    {totalQty}
                                                </div>

                                                <div className="small">
                                                    Total Pembelian
                                                </div>
                                                <div className="fw-bold text-success">
                                                    {formatRupiah(totalAmount)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Catatan
                                        </label>

                                        <textarea
                                            className={`form-control ${errors.note ? "is-invalid" : ""}`}
                                            rows="3"
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                            placeholder="Catatan pembelian"
                                            disabled={!canSubmit}
                                        ></textarea>

                                        {errors.note && (
                                            <div className="invalid-feedback">
                                                {errors.note}
                                            </div>
                                        )}
                                    </div>

                                    <div className="table-responsive mb-4">
                                        <table className="table table-bordered align-middle mb-0">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Produk</th>
                                                    <th>Satuan</th>
                                                    <th className="text-center">
                                                        Stok Saat Ini
                                                    </th>
                                                    <th className="text-center">
                                                        Qty
                                                    </th>
                                                    <th className="text-end">
                                                        Harga Beli
                                                    </th>
                                                    <th className="text-end">
                                                        Harga Jual
                                                    </th>
                                                    <th className="text-end">
                                                        Subtotal
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{ width: "10%" }}
                                                    >
                                                        Aksi
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {items.map((item, index) => {
                                                    const selectedProduct =
                                                        productMap[
                                                            item.product_id
                                                        ];

                                                    const subtotal =
                                                        Number(item.qty || 0) *
                                                        Number(
                                                            item.buy_price || 0,
                                                        );

                                                    const buyPriceAboveSellPrice =
                                                        isBuyPriceAboveSellPrice(
                                                            item,
                                                        );

                                                    return (
                                                        <tr key={index}>
                                                            <td>
                                                                <select
                                                                    className={`form-select ${errors[`items.${index}.product_id`] ? "is-invalid" : ""}`}
                                                                    value={
                                                                        item.product_id
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "product_id",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !canSubmit
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        Pilih
                                                                        Produk
                                                                    </option>

                                                                    {products.map(
                                                                        (
                                                                            product,
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    product.id
                                                                                }
                                                                                value={
                                                                                    product.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    product.title
                                                                                }
                                                                                {product.barcode
                                                                                    ? ` (${product.barcode})`
                                                                                    : ""}
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                            </td>

                                                            <td>
                                                                <select className="form-select form-select-sm" value={item.unit_id} onChange={(e) => handleItemChange(index, "unit_id", e.target.value)} disabled={!selectedProduct}>
                                                                    <option value="">-</option>
                                                                    {(selectedProduct?.product_units || []).map((row) => (
                                                                        <option key={row.id} value={row.unit_id}>{row.unit?.abbreviation} (x{row.conversion_factor})</option>
                                                                    ))}
                                                                </select>
                                                            </td>

                                                            <td className="text-center">
                                                                {selectedProduct
                                                                    ? `${selectedProduct.stock} ${selectedProduct.unit || ""}`
                                                                    : "-"}
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className={`form-control text-center ${errors[`items.${index}.qty`] ? "is-invalid" : ""}`}
                                                                    value={
                                                                        item.qty
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "qty",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !canSubmit
                                                                    }
                                                                />
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className={`form-control text-end ${
                                                                        errors[
                                                                            `items.${index}.buy_price`
                                                                        ]
                                                                            ? "is-invalid"
                                                                            : buyPriceAboveSellPrice
                                                                              ? "border border-warning"
                                                                              : ""
                                                                    }`}
                                                                    value={
                                                                        item.buy_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "buy_price",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !canSubmit
                                                                    }
                                                                />
                                                                {buyPriceAboveSellPrice && (
                                                                    <small className="text-warning d-block mt-1">
                                                                        Harga
                                                                        beli
                                                                        lebih
                                                                        tinggi
                                                                        dari
                                                                        harga
                                                                        jual
                                                                        produk.
                                                                    </small>
                                                                )}
                                                            </td>

                                                            <td className="text-end">
                                                                {selectedProduct
                                                                    ? formatRupiah(
                                                                          selectedProduct.sell_price,
                                                                      )
                                                                    : "-"}
                                                            </td>

                                                            <td className="text-end fw-bold text-success">
                                                                {formatRupiah(
                                                                    subtotal,
                                                                )}
                                                            </td>

                                                            <td className="text-center">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() =>
                                                                        removeItem(
                                                                            index,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        items.length ===
                                                                            1 ||
                                                                        !canSubmit
                                                                    }
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary shadow-sm"
                                            onClick={addItem}
                                            disabled={!canSubmit}
                                        >
                                            <i className="fas fa-plus me-2"></i>
                                            Tambah Baris
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-success shadow-sm"
                                            disabled={!canSubmit}
                                        >
                                            <i className="fas fa-save me-2"></i>
                                            Simpan Pembelian
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
