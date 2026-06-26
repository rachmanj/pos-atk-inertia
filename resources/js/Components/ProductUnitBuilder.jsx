import React from "react";

export default function ProductUnitBuilder({ units = [], rows = [], onChange, errors = {} }) {
    const updateRow = (index, field, value) => {
        const next = rows.map((row, rowIndex) => {
            if (rowIndex !== index) {
                if (field === "is_base_unit" && value) {
                    return { ...row, is_base_unit: false };
                }
                if (field === "is_default_sell" && value) {
                    return { ...row, is_default_sell: false };
                }
                return row;
            }

            return {
                ...row,
                [field]: field === "is_base_unit" || field === "is_default_sell" ? !!value : value,
            };
        });

        onChange(next);
    };

    const addRow = () => {
        onChange([
            ...rows,
            {
                unit_id: "",
                conversion_factor: 1,
                sell_price: 0,
                is_base_unit: rows.length === 0,
                is_default_sell: rows.length === 0,
            },
        ]);
    };

    const removeRow = (index) => {
        if (rows.length === 1) return;
        onChange(rows.filter((_, rowIndex) => rowIndex !== index));
    };

    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="fw-bold mb-0">Satuan & Harga Jual</label>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addRow}>
                    <i className="fas fa-plus me-1"></i> Tambah Satuan
                </button>
            </div>
            <small className="d-block text-muted mb-2">Harga jual per satuan; satuan default dipakai di POS dan daftar produk.</small>
            {errors.product_units && <div className="text-danger small mb-2">{errors.product_units}</div>}
            <div className="table-responsive">
                <table className="table table-bordered table-sm">
                    <thead className="table-light">
                        <tr>
                            <th>Satuan</th>
                            <th>Konversi ke Base</th>
                            <th>Harga Jual</th>
                            <th>Base</th>
                            <th>Default Jual</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index}>
                                <td>
                                    <select className="form-select form-select-sm" value={row.unit_id} onChange={(e) => updateRow(index, "unit_id", e.target.value)} required>
                                        <option value="">Pilih</option>
                                        {units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input type="number" min="0.0001" step="0.0001" className="form-control form-control-sm" value={row.conversion_factor} onChange={(e) => updateRow(index, "conversion_factor", e.target.value)} />
                                </td>
                                <td>
                                    <input type="number" min="0" className="form-control form-control-sm" value={row.sell_price} onChange={(e) => updateRow(index, "sell_price", e.target.value)} />
                                </td>
                                <td className="text-center">
                                    <input type="radio" name="base_unit" checked={!!row.is_base_unit} onChange={() => updateRow(index, "is_base_unit", true)} />
                                </td>
                                <td className="text-center">
                                    <input type="radio" name="default_sell" checked={!!row.is_default_sell} onChange={() => updateRow(index, "is_default_sell", true)} />
                                </td>
                                <td>
                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <small className="text-muted">Contoh: 1 box = 40 pcs → konversi 40 jika base unit adalah pcs.</small>
        </div>
    );
}
