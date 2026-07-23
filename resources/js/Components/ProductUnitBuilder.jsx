import {
    Button,
    Flex,
    InputNumber,
    Radio,
    Select,
    Space,
    Table,
    Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function ProductUnitBuilder({
    units = [],
    rows = [],
    onChange,
    errors = {},
}) {
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
                [field]:
                    field === "is_base_unit" || field === "is_default_sell"
                        ? !!value
                        : value,
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

    const unitOptions = units.map((unit) => ({
        value: String(unit.id),
        label: `${unit.name} (${unit.abbreviation})`,
    }));

    const columns = [
        {
            title: "Satuan",
            width: 200,
            render: (_, row, index) => (
                <Select
                    style={{ width: "100%" }}
                    placeholder="Pilih"
                    value={row.unit_id || undefined}
                    options={unitOptions}
                    onChange={(value) => updateRow(index, "unit_id", value)}
                />
            ),
        },
        {
            title: "Konversi ke Base",
            width: 140,
            render: (_, row, index) => (
                <InputNumber
                    min={0.0001}
                    step={0.0001}
                    style={{ width: "100%" }}
                    value={row.conversion_factor}
                    onChange={(value) =>
                        updateRow(index, "conversion_factor", value ?? 1)
                    }
                />
            ),
        },
        {
            title: "Harga Jual",
            width: 140,
            render: (_, row, index) => (
                <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    value={row.sell_price}
                    onChange={(value) =>
                        updateRow(index, "sell_price", value ?? 0)
                    }
                />
            ),
        },
        {
            title: "Base",
            width: 70,
            align: "center",
            render: (_, row, index) => (
                <Radio
                    checked={!!row.is_base_unit}
                    onChange={() => updateRow(index, "is_base_unit", true)}
                />
            ),
        },
        {
            title: "Default Jual",
            width: 100,
            align: "center",
            render: (_, row, index) => (
                <Radio
                    checked={!!row.is_default_sell}
                    onChange={() => updateRow(index, "is_default_sell", true)}
                />
            ),
        },
        {
            title: "",
            width: 60,
            align: "center",
            render: (_, __, index) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                />
            ),
        },
    ];

    return (
        <div style={{ marginBottom: 24 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                <Text strong>Satuan & Harga Jual</Text>
                <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addRow}
                >
                    Tambah Satuan
                </Button>
            </Flex>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                Harga jual per satuan; satuan default dipakai di POS dan daftar
                produk.
            </Text>
            {errors.product_units && (
                <Text type="danger" style={{ display: "block", marginBottom: 8 }}>
                    {errors.product_units}
                </Text>
            )}
            <Table
                size="small"
                rowKey={(_, index) => index}
                columns={columns}
                dataSource={rows}
                pagination={false}
                scroll={{ x: 700 }}
            />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                Contoh: 1 box = 40 pcs → konversi 40 jika base unit adalah pcs.
            </Text>
        </div>
    );
}
