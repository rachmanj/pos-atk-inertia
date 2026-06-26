import React from "react";

export default function ProductComponentBuilder({
    physicalProducts = [],
    rows = [],
    onChange,
    errors = {},
}) {
    const addRow = () => {
        onChange([
            ...rows,
            { component_product_id: "", qty_per_unit: 1, note: "" },
        ]);
    };

    const updateRow = (index, field, value) => {
        onChange(
            rows.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [field]: value } : row,
            ),
        );
    };

    const removeRow = (index) => {
        onChange(rows.filter((_, rowIndex) => rowIndex !== index));
    };

    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-bold mb-0">Bahan Baku (Resep)</label>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={addRow}
                >
                    <i className="fas fa-plus me-1"></i>
                    Tambah Bahan
                </button>
            </div>

            <div className="alert alert-info py-2 small mb-3">
                Setiap unit layanan yang terjual akan mengurangi stok bahan baku sesuai qty di bawah.
            </div>

            {errors.components && (
                <div className="text-danger small mb-2">{errors.components}</div>
            )}

            {rows.length === 0 ? (
                <div className="border rounded-3 p-3 text-muted small">
                    Belum ada bahan baku. Tambahkan minimal satu produk fisik.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Bahan Baku</th>
                                <th style={{ width: "160px" }}>Qty / Unit Layanan</th>
                                <th style={{ width: "60px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={index}>
                                    <td>
                                        <select
                                            className="form-select"
                                            value={row.component_product_id}
                                            onChange={(e) =>
                                                updateRow(
                                                    index,
                                                    "component_product_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                -- Pilih Produk Fisik --
                                            </option>
                                            {physicalProducts.map((product) => (
                                                <option
                                                    key={product.id}
                                                    value={product.id}
                                                >
                                                    {product.title} ({product.barcode}) — stok {product.stock} {product.unit}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0.0001"
                                            step="0.0001"
                                            className="form-control"
                                            value={row.qty_per_unit}
                                            onChange={(e) =>
                                                updateRow(
                                                    index,
                                                    "qty_per_unit",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="text-center">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => removeRow(index)}
                                            disabled={rows.length === 1}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
