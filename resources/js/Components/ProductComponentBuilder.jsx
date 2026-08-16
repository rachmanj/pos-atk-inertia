import {
    Alert,
    Button,
    Empty,
    Flex,
    InputNumber,
    Select,
    Table,
    Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

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

    const productOptions = physicalProducts.map((product) => ({
        value: String(product.id),
        label: `${product.title} (${product.barcode}) · stok ${product.stock} ${product.unit}`,
    }));

    const columns = [
        {
            title: "Bahan Baku",
            render: (_, row, index) => (
                <Select
                    showSearch
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    placeholder="Pilih produk fisik"
                    value={row.component_product_id || undefined}
                    options={productOptions}
                    onChange={(value) =>
                        updateRow(index, "component_product_id", value)
                    }
                />
            ),
        },
        {
            title: "Qty / Unit Layanan",
            width: 160,
            render: (_, row, index) => (
                <InputNumber
                    min={0.0001}
                    step={0.0001}
                    style={{ width: "100%" }}
                    value={row.qty_per_unit}
                    onChange={(value) =>
                        updateRow(index, "qty_per_unit", value ?? 1)
                    }
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
            <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                <Text strong>Bahan Baku (Resep)</Text>
                <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addRow}
                >
                    Tambah Bahan
                </Button>
            </Flex>

            <Alert
                type="info"
                showIcon
                message="Setiap unit layanan yang terjual akan mengurangi stok bahan baku sesuai qty di bawah."
                style={{ marginBottom: 12 }}
            />

            {errors.components && (
                <Text type="danger" style={{ display: "block", marginBottom: 8 }}>
                    {errors.components}
                </Text>
            )}

            {rows.length === 0 ? (
                <Empty description="Belum ada bahan baku. Tambahkan minimal satu produk fisik." />
            ) : (
                <Table
                    size="small"
                    rowKey={(_, index) => index}
                    columns={columns}
                    dataSource={rows}
                    pagination={false}
                    scroll={{ x: 600 }}
                />
            )}
        </div>
    );
}
