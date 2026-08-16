import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
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
    DeleteOutlined,
    PlusOutlined,
    SaveOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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
                        buy_price: selectedProduct
                            ? selectedProduct.buy_price
                            : 0,
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

    const totalAmount = items.reduce(
        (sum, item) =>
            sum + Number(item.qty || 0) * Number(item.buy_price || 0),
        0,
    );

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
                        errors[`items.${index}.product_id`] ? "error" : undefined
                    }
                    options={products.map((product) => ({
                        value: String(product.id),
                        label: `${product.title}${product.barcode ? ` (${product.barcode})` : ""}`,
                    }))}
                />
            ),
        },
        {
            title: "Satuan",
            width: 140,
            render: (_, item, index) => {
                const selectedProduct = productMap[item.product_id];
                return (
                    <Select
                        className="w-100"
                        value={item.unit_id || undefined}
                        onChange={(value) =>
                            handleItemChange(index, "unit_id", value)
                        }
                        disabled={!selectedProduct}
                        options={(selectedProduct?.product_units || []).map(
                            (row) => ({
                                value: String(row.unit_id),
                                label: `${row.unit?.abbreviation} (x${row.conversion_factor})`,
                            }),
                        )}
                    />
                );
            },
        },
        {
            title: "Stok Saat Ini",
            align: "center",
            width: 120,
            render: (_, item) => {
                const selectedProduct = productMap[item.product_id];
                return selectedProduct
                    ? `${selectedProduct.stock} ${selectedProduct.unit || ""}`
                    : "-";
            },
        },
        {
            title: "Qty",
            align: "center",
            width: 100,
            render: (_, item, index) => (
                <InputNumber
                    min={1}
                    value={item.qty}
                    onChange={(value) =>
                        handleItemChange(index, "qty", value ?? 1)
                    }
                    disabled={!canSubmit}
                    status={
                        errors[`items.${index}.qty`] ? "error" : undefined
                    }
                />
            ),
        },
        {
            title: "Harga Beli",
            align: "right",
            width: 140,
            render: (_, item, index) => {
                const warn = isBuyPriceAboveSellPrice(item);
                return (
                    <>
                        <InputNumber
                            min={0}
                            className="w-100"
                            value={item.buy_price}
                            onChange={(value) =>
                                handleItemChange(
                                    index,
                                    "buy_price",
                                    value ?? 0,
                                )
                            }
                            disabled={!canSubmit}
                            status={
                                errors[`items.${index}.buy_price`]
                                    ? "error"
                                    : warn
                                      ? "warning"
                                      : undefined
                            }
                        />
                        {warn && (
                            <Text type="warning" className="small d-block">
                                Harga beli lebih tinggi dari harga jual produk.
                            </Text>
                        )}
                    </>
                );
            },
        },
        {
            title: "Harga Jual",
            align: "right",
            width: 120,
            render: (_, item) => {
                const selectedProduct = productMap[item.product_id];
                return selectedProduct
                    ? formatRupiah(selectedProduct.sell_price)
                    : "-";
            },
        },
        {
            title: "Subtotal",
            align: "right",
            width: 120,
            render: (_, item) => (
                <Text strong type="success">
                    {formatRupiah(
                        Number(item.qty || 0) * Number(item.buy_price || 0),
                    )}
                </Text>
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
                <title>Tambah Pembelian - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    title={
                        <Title level={5} className="mb-0">
                            <ShoppingCartOutlined className="me-2" />
                            TAMBAH PEMBELIAN
                        </Title>
                    }
                    extra={
                        <Link href="/account/purchases">
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
                                    {suppliers.length === 0 && (
                                        <div className="mb-2">
                                            Supplier belum tersedia. Tambahkan
                                            supplier terlebih dahulu.
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

                    <form onSubmit={storePurchase}>
                        <Row gutter={16} className="mb-4">
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
                                        placeholder="Pilih Supplier"
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
                                    label="Tanggal Pembelian"
                                    validateStatus={
                                        errors.purchase_date ? "error" : ""
                                    }
                                    help={errors.purchase_date}
                                    required
                                >
                                    <DatePicker
                                        className="w-100"
                                        format="YYYY-MM-DD"
                                        value={
                                            purchaseDate
                                                ? dayjs(purchaseDate)
                                                : null
                                        }
                                        onChange={(_, dateString) =>
                                            setPurchaseDate(dateString)
                                        }
                                        disabled={!canSubmit}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item label="Ringkasan">
                                    <div className="border rounded-3 p-3 bg-light">
                                        <Text type="secondary" className="small">
                                            Total Qty
                                        </Text>
                                        <div className="fw-bold mb-2">
                                            {totalQty}
                                        </div>
                                        <Text type="secondary" className="small">
                                            Total Pembelian
                                        </Text>
                                        <div className="fw-bold text-success">
                                            {formatRupiah(totalAmount)}
                                        </div>
                                    </div>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Catatan"
                            validateStatus={errors.note ? "error" : ""}
                            help={errors.note}
                            className="mb-4"
                        >
                            <Input.TextArea
                                rows={3}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Catatan pembelian"
                                disabled={!canSubmit}
                            />
                        </Form.Item>

                        <Table
                            bordered
                            rowKey={(_, index) => index}
                            columns={columns}
                            dataSource={items}
                            pagination={false}
                            scroll={{ x: 900 }}
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
                                icon={<SaveOutlined />}
                                disabled={!canSubmit}
                            >
                                Simpan Pembelian
                            </Button>
                        </Space>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
