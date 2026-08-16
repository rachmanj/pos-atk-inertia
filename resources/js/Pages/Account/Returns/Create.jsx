import LayoutAccount from "../../../Layouts/Account";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, SEMANTIC } from "../../../theme/colors";
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    SendOutlined,
    UndoOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const reasonLabel = {
    defect: "Barang Rusak",
    wrong_item: "Salah Barang",
    customer_request: "Permintaan Customer",
    other: "Lainnya",
};

export default function Create() {
    const { transaction, returnableItems = [], errors = {} } = usePage().props;
    const loading = useInertiaLoading();

    const [reason, setReason] = useState("customer_request");
    const [note, setNote] = useState("");
    const [items, setItems] = useState(
        returnableItems.map((item) => ({
            product_id: item.product_id,
            qty: 0,
            restock: true,
            remaining_qty: item.remaining_qty,
            price: item.price,
            product_title: item.product_title,
        })),
    );

    const handleQtyChange = (productId, value) => {
        const parsedQty = Number(value || 0);
        const qty = Number.isFinite(parsedQty) ? Math.floor(parsedQty) : 0;

        setItems((currentItems) =>
            currentItems.map((item) => {
                if (item.product_id !== productId) return item;
                const safeQty = Math.max(0, Math.min(qty, item.remaining_qty));
                return { ...item, qty: safeQty };
            }),
        );
    };

    const handleRestockChange = (productId, checked) => {
        setItems((currentItems) =>
            currentItems.map((item) =>
                item.product_id === productId
                    ? { ...item, restock: checked }
                    : item,
            ),
        );
    };

    const selectedItems = items.filter((item) => item.qty > 0);

    const grossTransactionTotal = (transaction.details || []).reduce(
        (total, detail) => total + Number(detail.subtotal || 0),
        0,
    );

    const calculateRefundTarget = (rawSubtotal) => {
        const discount = Number(transaction.discount || 0);
        if (discount <= 0 || grossTransactionTotal <= 0) return rawSubtotal;
        const discountShare = Math.round(
            discount * (rawSubtotal / grossTransactionTotal),
        );
        return Math.max(0, rawSubtotal - discountShare);
    };

    const rawSelectedTotal = selectedItems.reduce(
        (total, item) =>
            total + Number(item.qty || 0) * Number(item.price || 0),
        0,
    );

    const totalRefundPreview = calculateRefundTarget(rawSelectedTotal);

    let allocatedPreviewRefund = 0;

    const refundPreviewByProductId = selectedItems.reduce(
        (preview, item, index) => {
            const isLastItem = index === selectedItems.length - 1;
            const refundSubtotal = isLastItem
                ? Math.max(0, totalRefundPreview - allocatedPreviewRefund)
                : calculateRefundTarget(
                      Number(item.qty || 0) * Number(item.price || 0),
                  );
            preview[item.product_id] = refundSubtotal;
            allocatedPreviewRefund += refundSubtotal;
            return preview;
        },
        {},
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedItems.length === 0) {
            Modal.warning({
                title: "Item belum dipilih",
                content:
                    "Pilih minimal satu item dengan qty retur lebih dari 0.",
            });
            return;
        }

        Modal.confirm({
            title: "Ajukan retur?",
            content:
                "Pengajuan retur akan dibuat dan menunggu persetujuan admin.",
            okText: "Ya, ajukan retur",
            cancelText: "Batal",
            onOk: () => {
                router.post("/account/returns", {
                    transaction_id: transaction.id,
                    reason,
                    note,
                    items: items.map((item) => ({
                        product_id: item.product_id,
                        qty: item.qty,
                        restock: item.restock,
                    })),
                });
            },
        });
    };

    const columns = [
        {
            title: "Produk",
            render: (_, item) => (
                <>
                    <Text strong>{item.product_title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Harga: {formatRupiah(item.price)}
                    </Text>
                </>
            ),
        },
        {
            title: "Dibeli",
            align: "center",
            dataIndex: "purchased_qty",
        },
        {
            title: "Sudah Retur",
            align: "center",
            dataIndex: "returned_qty",
        },
        {
            title: "Bisa Diretur",
            align: "center",
            dataIndex: "remaining_qty",
        },
        {
            title: "Qty Retur",
            align: "center",
            width: 120,
            render: (_, item) => {
                const selectedItem = items.find(
                    (row) => row.product_id === item.product_id,
                );
                return (
                    <InputNumber
                        min={0}
                        max={item.remaining_qty}
                        value={selectedItem?.qty || 0}
                        onChange={(value) =>
                            handleQtyChange(item.product_id, value ?? 0)
                        }
                    />
                );
            },
        },
        {
            title: "Restock",
            align: "center",
            width: 90,
            render: (_, item) => {
                const selectedItem = items.find(
                    (row) => row.product_id === item.product_id,
                );
                return (
                    <Checkbox
                        checked={selectedItem?.restock || false}
                        onChange={(e) =>
                            handleRestockChange(
                                item.product_id,
                                e.target.checked,
                            )
                        }
                    />
                );
            },
        },
        {
            title: "Estimasi Refund",
            align: "right",
            render: (_, item) => (
                <Text strong>
                    {formatRupiah(
                        refundPreviewByProductId[item.product_id] || 0,
                    )}
                </Text>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>Ajukan Retur - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <UndoOutlined
                                    style={{ color: BRAND.primary }}
                                />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        AJUKAN RETUR
                                    </Title>
                                    <Text type="secondary">
                                        Invoice: {transaction.invoice}
                                    </Text>
                                </div>
                            </Space>
                        }
                        extra={
                            <Link
                                href={`/account/transactions/${transaction.invoice}`}
                            >
                                <Button icon={<ArrowLeftOutlined />}>
                                    Kembali
                                </Button>
                            </Link>
                        }
                    >
                        {errors.items && (
                            <Alert
                                type="error"
                                message={errors.items}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col xs={24} md={8}>
                                <Card size="small" style={{ height: "100%" }}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        Invoice Transaksi
                                    </Text>
                                    <Title level={5} style={{ margin: 0 }}>
                                        {transaction.invoice}
                                    </Title>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card size="small" style={{ height: "100%" }}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        Customer
                                    </Text>
                                    <Title level={5} style={{ margin: 0 }}>
                                        {transaction.customer?.name || "Umum"}
                                    </Title>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card size="small" style={{ height: "100%" }}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        Total Transaksi
                                    </Text>
                                    <Title
                                        level={5}
                                        style={{
                                            margin: 0,
                                            color: SEMANTIC.success,
                                        }}
                                    >
                                        {formatRupiah(transaction.grand_total)}
                                    </Title>
                                </Card>
                            </Col>
                        </Row>

                        <form onSubmit={handleSubmit}>
                            <Row gutter={16} style={{ marginBottom: 16 }}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Alasan Retur">
                                        <Select
                                            value={reason}
                                            onChange={setReason}
                                            options={Object.entries(
                                                reasonLabel,
                                            ).map(([value, label]) => ({
                                                value,
                                                label,
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Catatan">
                                        <Input
                                            placeholder="Contoh: kemasan rusak, ukuran salah, dll."
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Table
                                rowKey="product_id"
                                columns={columns}
                                dataSource={returnableItems}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                summary={() => (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell
                                            index={0}
                                            colSpan={6}
                                            align="end"
                                        >
                                            <Text strong>
                                                Estimasi Total Refund
                                            </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell
                                            index={1}
                                            align="end"
                                        >
                                            <Text
                                                strong
                                                style={{
                                                    color: SEMANTIC.success,
                                                }}
                                            >
                                                {formatRupiah(
                                                    totalRefundPreview,
                                                )}
                                            </Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                )}
                            />

                            <Space
                                style={{
                                    width: "100%",
                                    justifyContent: "flex-end",
                                    marginTop: 16,
                                }}
                            >
                                <Link
                                    href={`/account/transactions/${transaction.invoice}`}
                                >
                                    <Button>Batal</Button>
                                </Link>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SendOutlined />}
                                >
                                    Ajukan Retur
                                </Button>
                            </Space>
                        </form>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
