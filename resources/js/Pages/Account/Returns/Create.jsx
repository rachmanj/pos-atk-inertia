import LayoutAccount from "../../../Layouts/Account";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
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
                    <div className="fw-bold">{item.product_title}</div>
                    <Text type="secondary" className="small">
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
                <strong>
                    {formatRupiah(
                        refundPreviewByProductId[item.product_id] || 0,
                    )}
                </strong>
            ),
        },
    ];

    return (
        <>
            <Head title="Ajukan Retur" />

            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    title={
                        <div>
                            <Title level={5} className="mb-1">
                                <UndoOutlined className="me-2" />
                                AJUKAN RETUR
                            </Title>
                            <Text type="secondary">
                                Invoice: {transaction.invoice}
                            </Text>
                        </div>
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
                            className="mb-4"
                        />
                    )}

                    <Row gutter={16} className="mb-4">
                        <Col xs={24} md={8}>
                            <div className="border rounded-3 p-3 h-100">
                                <Text type="secondary" className="small">
                                    Invoice Transaksi
                                </Text>
                                <Title level={5} className="mb-0">
                                    {transaction.invoice}
                                </Title>
                            </div>
                        </Col>
                        <Col xs={24} md={8}>
                            <div className="border rounded-3 p-3 h-100">
                                <Text type="secondary" className="small">
                                    Customer
                                </Text>
                                <Title level={5} className="mb-0">
                                    {transaction.customer?.name || "Umum"}
                                </Title>
                            </div>
                        </Col>
                        <Col xs={24} md={8}>
                            <div className="border rounded-3 p-3 h-100">
                                <Text type="secondary" className="small">
                                    Total Transaksi
                                </Text>
                                <Title level={5} className="mb-0 text-success">
                                    {formatRupiah(transaction.grand_total)}
                                </Title>
                            </div>
                        </Col>
                    </Row>

                    <form onSubmit={handleSubmit}>
                        <Row gutter={16} className="mb-4">
                            <Col xs={24} md={12}>
                                <Form.Item label="Alasan Retur">
                                    <Select
                                        value={reason}
                                        onChange={setReason}
                                        options={Object.entries(reasonLabel).map(
                                            ([value, label]) => ({
                                                value,
                                                label,
                                            }),
                                        )}
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
                            bordered
                            rowKey="product_id"
                            columns={columns}
                            dataSource={returnableItems}
                            pagination={false}
                            scroll={{ x: 800 }}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell
                                        index={0}
                                        colSpan={6}
                                        align="end"
                                    >
                                        <strong>Estimasi Total Refund</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="end">
                                        <Text strong type="success">
                                            {formatRupiah(totalRefundPreview)}
                                        </Text>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            )}
                        />

                        <div className="d-flex justify-content-end gap-2 mt-4">
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
                        </div>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
