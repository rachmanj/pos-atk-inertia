import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { formatRupiahCompact } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Form,
    Grid,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    InboxOutlined,
    PlusOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const createEmptyItem = () => ({
    product_id: "",
    unit_id: "",
    conversion_factor: 1,
    qty: 1,
    cost_price: 0,
});

export default function ConsignmentCreate() {
    const { errors, suppliers, products, defaultReceivedDate } = usePage().props;
    const loading = useInertiaLoading();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [supplierId, setSupplierId] = useState(
        suppliers[0]?.id ? String(suppliers[0].id) : "",
    );
    const [receivedDate, setReceivedDate] = useState(defaultReceivedDate);
    const [note, setNote] = useState("");
    const [items, setItems] = useState([createEmptyItem()]);

    const productMap = useMemo(() => {
        return products.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});
    }, [products]);

    const canSubmit = suppliers.length > 0 && products.length > 0;

    const handleItemChange = (index, field, value) => {
        setItems((prevItems) =>
            prevItems.map((item, itemIndex) => {
                if (itemIndex !== index) return item;

                if (field === "product_id") {
                    const selectedProduct = productMap[value];
                    const defaultUnit =
                        selectedProduct?.product_units?.find(
                            (u) => u.is_base_unit,
                        ) || selectedProduct?.product_units?.[0];

                    return {
                        ...item,
                        product_id: value,
                        unit_id: defaultUnit
                            ? String(defaultUnit.unit_id)
                            : "",
                        conversion_factor: defaultUnit
                            ? Number(defaultUnit.conversion_factor)
                            : 1,
                        cost_price: 0,
                    };
                }

                if (field === "unit_id") {
                    const selectedProduct = productMap[item.product_id];
                    const selectedUnit = selectedProduct?.product_units?.find(
                        (u) => String(u.unit_id) === String(value),
                    );

                    return {
                        ...item,
                        unit_id: value,
                        conversion_factor: selectedUnit
                            ? Number(selectedUnit.conversion_factor)
                            : 1,
                    };
                }

                return {
                    ...item,
                    [field]:
                        field === "qty" || field === "cost_price"
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

    const totalQtyBase = items.reduce((sum, item) => {
        const factor = Number(item.conversion_factor || 1);
        return sum + Math.round(Number(item.qty || 0) * factor);
    }, 0);

    const totalNilai = items.reduce((sum, item) => {
        return (
            sum + Number(item.qty || 0) * Number(item.cost_price || 0)
        );
    }, 0);

    const storeConsignment = (e) => {
        e.preventDefault();

        router.post("/account/consignments", {
            supplier_id: supplierId,
            received_date: receivedDate,
            note,
            items: items.map((item) => ({
                product_id: Number(item.product_id),
                unit_id: item.unit_id ? Number(item.unit_id) : null,
                conversion_factor: Number(item.conversion_factor || 1),
                qty: Number(item.qty),
                cost_price: Number(item.cost_price),
            })),
        });
    };

    const productSelect = (item, index) => (
        <Select
            showSearch
            optionFilterProp="label"
            style={{ width: "100%" }}
            placeholder="Pilih produk"
            value={item.product_id || undefined}
            onChange={(value) => handleItemChange(index, "product_id", value)}
            disabled={!canSubmit}
            status={errors[`items.${index}.product_id`] ? "error" : undefined}
            options={products.map((product) => ({
                value: String(product.id),
                label: `${product.title}${product.barcode ? ` (${product.barcode})` : ""}`,
            }))}
        />
    );

    const unitSelect = (item, index) => {
        const selectedProduct = productMap[item.product_id];
        return (
            <Select
                style={{ width: "100%" }}
                value={item.unit_id || undefined}
                onChange={(value) => handleItemChange(index, "unit_id", value)}
                disabled={!selectedProduct}
                options={(selectedProduct?.product_units || []).map((row) => ({
                    value: String(row.unit_id),
                    label: `${row.unit?.abbreviation} (x${row.conversion_factor})`,
                }))}
            />
        );
    };

    const columns = [
        {
            title: "Produk",
            render: (_, item, index) => productSelect(item, index),
        },
        {
            title: "Satuan",
            width: 140,
            render: (_, item, index) => unitSelect(item, index),
        },
        {
            title: "Stok",
            align: "center",
            width: 100,
            render: (_, item) => {
                const selectedProduct = productMap[item.product_id];
                return selectedProduct ? selectedProduct.stock : "-";
            },
        },
        {
            title: "Qty",
            align: "center",
            width: 96,
            render: (_, item, index) => (
                <InputNumber
                    min={1}
                    value={item.qty}
                    onChange={(value) =>
                        handleItemChange(index, "qty", value ?? 1)
                    }
                    disabled={!canSubmit}
                    status={errors[`items.${index}.qty`] ? "error" : undefined}
                />
            ),
        },
        {
            title: "Harga Konsinyasi",
            align: "right",
            width: 150,
            render: (_, item, index) => (
                <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    value={item.cost_price}
                    onChange={(value) =>
                        handleItemChange(index, "cost_price", value ?? 0)
                    }
                    disabled={!canSubmit}
                    status={
                        errors[`items.${index}.cost_price`] ? "error" : undefined
                    }
                />
            ),
        },
        {
            title: "Subtotal",
            align: "right",
            width: 120,
            render: (_, item) => (
                <Text strong style={{ color: "var(--semantic-success)" }}>
                    {formatRupiahCompact(
                        Number(item.qty || 0) * Number(item.cost_price || 0),
                    )}
                </Text>
            ),
        },
        {
            title: "",
            width: 56,
            align: "center",
            render: (_, __, index) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1 || !canSubmit}
                />
            ),
        },
    ];

    const renderMobileItem = (item, index) => {
        const selectedProduct = productMap[item.product_id];
        return (
            <Card key={index} size="small" style={{ marginBottom: 12 }}>
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    <Form.Item
                        label="Produk"
                        style={{ marginBottom: 0 }}
                        validateStatus={
                            errors[`items.${index}.product_id`] ? "error" : ""
                        }
                    >
                        {productSelect(item, index)}
                    </Form.Item>
                    <Row gutter={8}>
                        <Col span={12}>
                            <Form.Item label="Satuan" style={{ marginBottom: 0 }}>
                                {unitSelect(item, index)}
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Stok" style={{ marginBottom: 0 }}>
                                <Text>
                                    {selectedProduct
                                        ? selectedProduct.stock
                                        : "-"}
                                </Text>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={8}>
                        <Col span={12}>
                            <Form.Item
                                label="Qty"
                                style={{ marginBottom: 0 }}
                                validateStatus={
                                    errors[`items.${index}.qty`] ? "error" : ""
                                }
                            >
                                <InputNumber
                                    min={1}
                                    style={{ width: "100%" }}
                                    value={item.qty}
                                    onChange={(value) =>
                                        handleItemChange(index, "qty", value ?? 1)
                                    }
                                    disabled={!canSubmit}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Harga"
                                style={{ marginBottom: 0 }}
                                validateStatus={
                                    errors[`items.${index}.cost_price`]
                                        ? "error"
                                        : ""
                                }
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: "100%" }}
                                    value={item.cost_price}
                                    onChange={(value) =>
                                        handleItemChange(
                                            index,
                                            "cost_price",
                                            value ?? 0,
                                        )
                                    }
                                    disabled={!canSubmit}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row justify="space-between" align="middle">
                        <Text type="secondary">Subtotal</Text>
                        <Text strong style={{ color: "var(--semantic-success)" }}>
                            {formatRupiahCompact(
                                Number(item.qty || 0) *
                                    Number(item.cost_price || 0),
                            )}
                        </Text>
                    </Row>
                    <Button
                        danger
                        block
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1 || !canSubmit}
                    >
                        Hapus Baris
                    </Button>
                </Space>
            </Card>
        );
    };

    return (
        <>
            <Head>
                <title>Tambah Konsinyasi - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <InboxOutlined
                                    style={{ color: "var(--brand-primary)" }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    TAMBAH PENERIMAAN KONSINYASI
                                </Title>
                            </Space>
                        }
                        extra={
                            <Link href="/account/consignments">
                                <Button icon={<ArrowLeftOutlined />}>
                                    KEMBALI
                                </Button>
                            </Link>
                        }
                    >
                        {!canSubmit && (
                            <Alert
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message={
                                    <Space direction="vertical" size={4}>
                                        {suppliers.length === 0 && (
                                            <span>
                                                Supplier belum tersedia. Tambahkan
                                                supplier terlebih dahulu.
                                            </span>
                                        )}
                                        {products.length === 0 && (
                                            <span>
                                                Produk belum tersedia. Tambahkan
                                                produk terlebih dahulu.
                                            </span>
                                        )}
                                    </Space>
                                }
                            />
                        )}

                        {errors.items && (
                            <Alert
                                type="error"
                                message={errors.items}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <form onSubmit={storeConsignment}>
                            <Row gutter={16} style={{ marginBottom: 16 }}>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Supplier"
                                        validateStatus={
                                            errors.supplier_id ? "error" : ""
                                        }
                                        help={errors.supplier_id}
                                        required
                                    >
                                        <Select
                                            placeholder="Pilih supplier"
                                            value={supplierId || undefined}
                                            onChange={setSupplierId}
                                            disabled={!canSubmit}
                                            options={suppliers.map((supplier) => ({
                                                value: String(supplier.id),
                                                label: `${supplier.name}${supplier.no_telp ? ` - ${supplier.no_telp}` : ""}`,
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Tanggal Terima"
                                        validateStatus={
                                            errors.received_date ? "error" : ""
                                        }
                                        help={errors.received_date}
                                        required
                                    >
                                        <DatePicker
                                            style={{ width: "100%" }}
                                            format="YYYY-MM-DD"
                                            value={
                                                receivedDate
                                                    ? dayjs(receivedDate)
                                                    : null
                                            }
                                            onChange={(_, dateString) =>
                                                setReceivedDate(dateString)
                                            }
                                            disabled={!canSubmit}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                label="Catatan"
                                validateStatus={errors.note ? "error" : ""}
                                help={errors.note}
                                style={{ marginBottom: 16 }}
                            >
                                <Input.TextArea
                                    rows={2}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Catatan penerimaan (opsional)"
                                    disabled={!canSubmit}
                                />
                            </Form.Item>

                            <Divider style={{ margin: "12px 0 16px" }}>
                                Barang titipan
                            </Divider>

                            {isMobile ? (
                                items.map((item, index) =>
                                    renderMobileItem(item, index),
                                )
                            ) : (
                                <Table
                                    rowKey={(_, index) => index}
                                    columns={columns}
                                    dataSource={items}
                                    pagination={false}
                                    style={{ marginBottom: 16 }}
                                />
                            )}

                            <Row justify="end" style={{ marginBottom: 16 }}>
                                <Col xs={24} sm={14} md={10}>
                                    <Card
                                        size="small"
                                        style={{ background: "var(--bg-subtle)" }}
                                    >
                                        <Space
                                            direction="vertical"
                                            size={4}
                                            style={{ width: "100%" }}
                                        >
                                            <Row justify="space-between">
                                                <Text type="secondary">
                                                    Total Qty (satuan dasar)
                                                </Text>
                                                <Text strong>{totalQtyBase}</Text>
                                            </Row>
                                            <Row justify="space-between">
                                                <Text type="secondary">
                                                    Perkiraan nilai titipan
                                                </Text>
                                                <Text
                                                    strong
                                                    style={{
                                                        color: "var(--semantic-success)",
                                                    }}
                                                >
                                                    {formatRupiahCompact(totalNilai)}
                                                </Text>
                                            </Row>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Stok bertambah; harga beli rata-rata
                                                produk tidak diubah.
                                            </Text>
                                        </Space>
                                    </Card>
                                </Col>
                            </Row>

                            <Space wrap>
                                <Button
                                    icon={<PlusOutlined />}
                                    onClick={addItem}
                                    disabled={!canSubmit}
                                >
                                    Tambah Baris
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    disabled={!canSubmit}
                                >
                                    Simpan Penerimaan
                                </Button>
                            </Space>
                        </form>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}