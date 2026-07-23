import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Table,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    CheckOutlined,
    DeleteOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const createEmptyItem = () => ({
    product_id: "",
    physical_stock: 0,
    note: "",
});

const differenceType = (difference) => {
    if (difference > 0) return "success";
    if (difference < 0) return "danger";
    return undefined;
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
                if (itemIndex !== index) return item;

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
                    [field]:
                        field === "physical_stock" ? Number(value) : value,
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

    const columns = [
        {
            title: "Produk",
            render: (_, item, index) => (
                <Select
                    showSearch
                    optionFilterProp="label"
                    className="w-100"
                    placeholder="Pilih Produk"
                    value={item.product_id || undefined}
                    onChange={(value) =>
                        handleItemChange(index, "product_id", value)
                    }
                    disabled={!canSubmit}
                    status={
                        errors[`items.${index}.product_id`]
                            ? "error"
                            : undefined
                    }
                    options={products.map((product) => ({
                        value: String(product.id),
                        label: `${product.title}${product.barcode ? ` (${product.barcode})` : ""}`,
                    }))}
                />
            ),
        },
        {
            title: "Stok Sistem",
            align: "center",
            width: 120,
            render: (_, item) => {
                const selectedProduct = productMap[item.product_id];
                const systemStock = selectedProduct
                    ? Number(selectedProduct.stock)
                    : 0;
                return selectedProduct
                    ? `${systemStock} ${selectedProduct.unit || ""}`
                    : "-";
            },
        },
        {
            title: "Stok Fisik",
            align: "center",
            width: 120,
            render: (_, item, index) => {
                const selectedProduct = productMap[item.product_id];
                return (
                    <InputNumber
                        min={0}
                        value={item.physical_stock}
                        onChange={(value) =>
                            handleItemChange(
                                index,
                                "physical_stock",
                                value ?? 0,
                            )
                        }
                        disabled={!canSubmit || !selectedProduct}
                        status={
                            errors[`items.${index}.physical_stock`]
                                ? "error"
                                : undefined
                        }
                    />
                );
            },
        },
        {
            title: "Selisih",
            align: "center",
            width: 100,
            render: (_, item) => {
                const selectedProduct = productMap[item.product_id];
                if (!selectedProduct) return "-";
                const systemStock = Number(selectedProduct.stock);
                const difference =
                    Number(item.physical_stock || 0) - systemStock;
                return (
                    <Text strong type={differenceType(difference)}>
                        {difference > 0 ? `+${difference}` : difference}
                    </Text>
                );
            },
        },
        {
            title: "Catatan Item",
            render: (_, item, index) => (
                <Input
                    value={item.note}
                    onChange={(e) =>
                        handleItemChange(index, "note", e.target.value)
                    }
                    placeholder="Catatan item"
                    disabled={!canSubmit}
                    status={
                        errors[`items.${index}.note`] ? "error" : undefined
                    }
                />
            ),
        },
        {
            title: "Aksi",
            align: "center",
            width: 70,
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

    return (
        <>
            <Head>
                <title>Stock Opname Baru - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    title={
                        <Title level={5} className="mb-0">
                            <CheckOutlined className="me-2" />
                            STOCK OPNAME BARU
                        </Title>
                    }
                    extra={
                        <Link href="/account/stock-opnames">
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
                            className="mb-4"
                            message={
                                <>
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
                                </>
                            }
                        />
                    )}

                    {errors.items && (
                        <Alert
                            type="error"
                            message={errors.items}
                            showIcon
                            className="mb-4"
                        />
                    )}

                    <form onSubmit={storeStockOpname}>
                        <Row gutter={16} className="mb-4">
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="Tanggal Opname"
                                    validateStatus={
                                        errors.opname_date ? "error" : ""
                                    }
                                    help={errors.opname_date}
                                    required
                                >
                                    <DatePicker
                                        className="w-100"
                                        format="YYYY-MM-DD"
                                        value={
                                            opnameDate
                                                ? dayjs(opnameDate)
                                                : null
                                        }
                                        onChange={(_, dateString) =>
                                            setOpnameDate(dateString)
                                        }
                                        disabled={!canSubmit}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Total Produk Dicek">
                                    <div className="border rounded-3 p-3 bg-light fw-bold">
                                        {totalItems}
                                    </div>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Total Selisih">
                                    <div className="border rounded-3 p-3 bg-light">
                                        <Text
                                            strong
                                            type={differenceType(
                                                totalDifference,
                                            )}
                                        >
                                            {totalDifference > 0
                                                ? `+${totalDifference}`
                                                : totalDifference}
                                        </Text>
                                    </div>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Catatan Opname"
                            validateStatus={errors.note ? "error" : ""}
                            help={errors.note}
                            className="mb-4"
                        >
                            <Input.TextArea
                                rows={3}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Catatan umum stock opname"
                                disabled={!canSubmit}
                            />
                        </Form.Item>

                        <Table
                            bordered
                            rowKey={(_, index) => index}
                            columns={columns}
                            dataSource={items}
                            pagination={false}
                            scroll={{ x: 800 }}
                            className="mb-4"
                        />

                        <Space>
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
                                icon={<CheckOutlined />}
                                disabled={!canSubmit}
                            >
                                Simpan Stock Opname
                            </Button>
                        </Space>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
