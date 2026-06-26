import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";

const createEmptyItem = () => ({
    product_id: "",
    physical_stock: 0,
    note: "",
});

const differenceClass = (difference) => {
    if (difference > 0) {
        return "text-success";
    }

    if (difference < 0) {
        return "text-danger";
    }

    return "text-primary";
};

export default function StockOpnameCreate() {
    const {
        products = [],
        defaultOpnameDate,
        errors = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [opnameDate, setOpnameDate] = useState(defaultOpnameDate);
    const [note, setNote] = useState("");
    const [items, setItems] = useState([createEmptyItem()]);

    const productMap = useMemo(() => {
        return products.reduce((acc, product) => {
            acc[product.id] = product;

            return acc;
        }, {});
    }, [products]);

    const canSubmit = products.length > 0;

    const handleItemChange = (index, field, value) => {
        setItems((prevItems) =>
            prevItems.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                if (field === "product_id") {
                    const selectedProduct = productMap[value];

                    return {
                        ...item,
                        product_id: value,
                        physical_stock: selectedProduct
                            ? selectedProduct.stock
                            : 0,
                    };
                }

                return {
                    ...item,
                    [field]: field === "physical_stock" ? Number(value) : value,
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

    const totalItems = items.filter((item) => item.product_id).length;

    const totalDifference = items.reduce((sum, item) => {
        const product = productMap[item.product_id];
        const systemStock = product ? Number(product.stock || 0) : 0;

        return sum + (Number(item.physical_stock || 0) - systemStock);
    }, 0);

    const storeStockOpname = (e) => {
        e.preventDefault();

        const submittedItems = items
            .filter((item) => Number(item.product_id) > 0)
            .map((item) => ({
                product_id: Number(item.product_id),
                physical_stock: Number(item.physical_stock),
                note: item.note,
            }));

        router.post("/account/stock-opnames", {
            opname_date: opnameDate,
            note: note,
            items: submittedItems,
        });
    };

    return (
        <>
            <Head>
                <title>Stock Opname Baru - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-clipboard-check me-2"></i>
                                    STOCK OPNAME BARU
                                </h5>

                                <Link
                                    href="/account/stock-opnames"
                                    className="btn btn-secondary shadow-sm rounded-sm"
                                >
                                    <i className="fa fa-arrow-left me-2"></i>
                                    KEMBALI
                                </Link>
                            </div>

                            <div className="card-body">
                                {!canSubmit && (
                                    <div className="alert alert-warning shadow-sm">
                                        Produk belum tersedia. Tambahkan produk
                                        terlebih dahulu sebelum membuat stock
                                        opname.
                                        {hasAnyPermission(
                                            ["products.create"],
                                            permissions,
                                        ) && (
                                            <Link
                                                href="/account/products/create"
                                                className="ms-2 fw-bold"
                                            >
                                                Tambah Produk
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {errors.items && (
                                    <div className="alert alert-danger shadow-sm">
                                        {errors.items}
                                    </div>
                                )}

                                <form onSubmit={storeStockOpname}>
                                    <div className="row">
                                        <div className="col-md-4 mb-4">
                                            <label className="fw-bold mb-2">
                                                Tanggal Opname
                                            </label>

                                            <input
                                                type="date"
                                                className={`form-control ${
                                                    errors.opname_date
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={opnameDate}
                                                onChange={(e) =>
                                                    setOpnameDate(
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!canSubmit}
                                            />

                                            {errors.opname_date && (
                                                <div className="invalid-feedback">
                                                    {errors.opname_date}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-4 mb-4">
                                            <label className="fw-bold mb-2">
                                                Total Produk Dicek
                                            </label>

                                            <div className="border rounded-3 p-3 bg-light h-100 fw-bold">
                                                {totalItems}
                                            </div>
                                        </div>

                                        <div className="col-md-4 mb-4">
                                            <label className="fw-bold mb-2">
                                                Total Selisih
                                            </label>

                                            <div
                                                className={`border rounded-3 p-3 bg-light h-100 fw-bold ${differenceClass(
                                                    totalDifference,
                                                )}`}
                                            >
                                                {totalDifference > 0
                                                    ? `+${totalDifference}`
                                                    : totalDifference}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Catatan Opname
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
                                            placeholder="Catatan umum stock opname"
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
                                                    <th className="text-center">
                                                        Stok Sistem
                                                    </th>
                                                    <th className="text-center">
                                                        Stok Fisik
                                                    </th>
                                                    <th className="text-center">
                                                        Selisih
                                                    </th>
                                                    <th>Catatan Item</th>
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

                                                    const systemStock =
                                                        selectedProduct
                                                            ? Number(
                                                                  selectedProduct.stock,
                                                              )
                                                            : 0;

                                                    const difference =
                                                        Number(
                                                            item.physical_stock ||
                                                                0,
                                                        ) - systemStock;

                                                    return (
                                                        <tr key={index}>
                                                            <td>
                                                                <select
                                                                    className={`form-select ${
                                                                        errors[
                                                                            `items.${index}.product_id`
                                                                        ]
                                                                            ? "is-invalid"
                                                                            : ""
                                                                    }`}
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

                                                            <td className="text-center fw-bold">
                                                                {selectedProduct
                                                                    ? `${systemStock} ${selectedProduct.unit || ""}`
                                                                    : "-"}
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className={`form-control text-center ${
                                                                        errors[
                                                                            `items.${index}.physical_stock`
                                                                        ]
                                                                            ? "is-invalid"
                                                                            : ""
                                                                    }`}
                                                                    value={
                                                                        item.physical_stock
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "physical_stock",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !canSubmit ||
                                                                        !selectedProduct
                                                                    }
                                                                />
                                                            </td>

                                                            <td
                                                                className={`text-center fw-bold ${differenceClass(
                                                                    difference,
                                                                )}`}
                                                            >
                                                                {selectedProduct
                                                                    ? difference >
                                                                      0
                                                                        ? `+${difference}`
                                                                        : difference
                                                                    : "-"}
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className={`form-control ${
                                                                        errors[
                                                                            `items.${index}.note`
                                                                        ]
                                                                            ? "is-invalid"
                                                                            : ""
                                                                    }`}
                                                                    value={
                                                                        item.note
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "note",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Catatan item"
                                                                    disabled={
                                                                        !canSubmit
                                                                    }
                                                                />
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
                                                                    <i className="fa fa-trash"></i>
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
                                            <i className="fa fa-plus me-2"></i>
                                            Tambah Baris
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-success shadow-sm"
                                            disabled={!canSubmit}
                                        >
                                            <i className="fa fa-save me-2"></i>
                                            Simpan Stock Opname
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
