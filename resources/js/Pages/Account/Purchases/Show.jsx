import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import {
    formatPurchaseDueDate,
    formatPurchasePaymentMethod,
    formatPurchasePaymentTerm,
    purchaseOverdueDays,
    purchasePaymentStatusColor,
    purchasePaymentStatusLabel,
} from "../../../Utils/purchasePayables";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    FileTextOutlined,
    PlusCircleOutlined,
    UndoOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function InfoCard({ label, children }) {
    return (
        <Card size="small" style={{ height: "100%" }}>
            <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
            >
                {label}
            </Text>
            {children}
        </Card>
    );
}

export default function PurchaseShow() {
    const {
        purchase,
        canRecordPayment = false,
        auth = {},
        flash = {},
    } = usePage().props;
    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();

    const paidAmount = useMemo(() => {
        const fromSum = purchase.paid_amount_sum;
        if (fromSum != null && fromSum !== "") {
            return Number(fromSum) || 0;
        }

        return (purchase.payments || []).reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0,
        );
    }, [purchase]);

    const remaining = Math.max(
        0,
        Number(purchase.total_amount || 0) - paidAmount,
    );

    const isFullyPaid = purchase.payment_status === "paid";

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paidOn, setPaidOn] = useState(dayjs().format("YYYY-MM-DD"));
    const [payAmount, setPayAmount] = useState(remaining);
    const [payMethod, setPayMethod] = useState("tunai");
    const [payNote, setPayNote] = useState("");

    const openPaymentModal = () => {
        setPaidOn(dayjs().format("YYYY-MM-DD"));
        setPayAmount(remaining);
        setPayMethod("tunai");
        setPayNote("");
        setPaymentModalOpen(true);
    };

    const submitPayment = () => {
        router.post(
            `/account/purchases/${purchase.invoice}/payments`,
            {
                paid_on: paidOn,
                amount: Number(payAmount),
                method: payMethod,
                note: payNote || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setPaymentModalOpen(false),
            },
        );
    };

    const deletePayment = (paymentId) => {
        router.delete(
            `/account/purchases/${purchase.invoice}/payments/${paymentId}`,
            { preserveScroll: true },
        );
    };

    const overdueDays = purchaseOverdueDays(
        purchase.due_date,
        purchase.payment_status,
    );

    const itemColumns = [
        {
            title: "Produk",
            render: (_, detail) => (
                <div>
                    <Text strong>{detail.product?.title || "-"}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {detail.product?.unit || "-"}
                    </Text>
                </div>
            ),
        },
        {
            title: "Barcode",
            render: (_, detail) => detail.product?.barcode || "-",
        },
        {
            title: "Qty",
            align: "center",
            dataIndex: "qty",
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Harga Beli",
            align: "right",
            dataIndex: "buy_price",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Subtotal",
            align: "right",
            dataIndex: "subtotal",
            render: (value) => (
                <Text strong style={{ color: "var(--semantic-success)" }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
        {
            title: "PPN",
            align: "right",
            dataIndex: "tax_amount",
            render: (value) => formatRupiah(value ?? 0),
        },
    ];

    const paymentColumns = [
        {
            title: "Tanggal Bayar",
            dataIndex: "paid_on",
            render: (value) => formatPurchaseDueDate(value),
        },
        {
            title: "Jumlah",
            align: "right",
            dataIndex: "amount",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Metode",
            dataIndex: "method",
            render: (value) => formatPurchasePaymentMethod(value),
        },
        {
            title: "Catatan",
            dataIndex: "note",
            render: (value) => value || "-",
        },
        {
            title: "Aksi",
            align: "center",
            width: 80,
            render: (_, payment) =>
                canRecordPayment ? (
                    <Popconfirm
                        title="Hapus pembayaran ini?"
                        description="Status utang akan dihitung ulang."
                        okText="Hapus"
                        cancelText="Batal"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deletePayment(payment.id)}
                    >
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                ) : null,
        },
    ];

    return (
        <>
            <Head>
                <title>{`Pembelian ${purchase.invoice} - VASIA Stationery`}</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Space
                        direction="vertical"
                        size="large"
                        style={{ width: "100%" }}
                    >
                        {flash.success && (
                            <Alert type="success" message={flash.success} showIcon />
                        )}
                        {flash.error && (
                            <Alert type="error" message={flash.error} showIcon />
                        )}

                        <Space
                            style={{
                                width: "100%",
                                justifyContent: "space-between",
                            }}
                            wrap
                        >
                            <Space>
                                <FileTextOutlined
                                    style={{
                                        fontSize: 20,
                                        color: "var(--brand-primary)",
                                    }}
                                />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        DETAIL PEMBELIAN
                                    </Title>
                                    <Text type="secondary">
                                        Invoice: {purchase.invoice}
                                    </Text>
                                </div>
                            </Space>
                            <Space wrap>
                                <Link href="/account/purchases">
                                    <Button icon={<ArrowLeftOutlined />}>
                                        KEMBALI
                                    </Button>
                                </Link>
                                {canRecordPayment && !isFullyPaid && (
                                    <Button
                                        type="primary"
                                        icon={<WalletOutlined />}
                                        onClick={openPaymentModal}
                                    >
                                        CATAT PEMBAYARAN
                                    </Button>
                                )}
                                {hasAnyPermission(
                                    ["purchases.create"],
                                    permissions,
                                ) && (
                                    <Link href="/account/purchases/create">
                                        <Button
                                            type="primary"
                                            icon={<PlusCircleOutlined />}
                                        >
                                            PEMBELIAN BARU
                                        </Button>
                                    </Link>
                                )}
                                {hasAnyPermission(
                                    ["supplier_returns.create"],
                                    permissions,
                                ) && (
                                    <Link
                                        href={`/account/supplier-returns/create/${purchase.invoice}`}
                                    >
                                        <Button danger icon={<UndoOutlined />}>
                                            RETUR SUPPLIER
                                        </Button>
                                    </Link>
                                )}
                            </Space>
                        </Space>

                        <Card size="small" title="Utang & Pembayaran">
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={8} md={4}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Status
                                    </Text>
                                    <div>
                                        <Tag
                                            color={purchasePaymentStatusColor(
                                                purchase.payment_status,
                                            )}
                                        >
                                            {purchasePaymentStatusLabel(
                                                purchase.payment_status,
                                            )}
                                        </Tag>
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Termin
                                    </Text>
                                    <div>
                                        <Text strong>
                                            {formatPurchasePaymentTerm(
                                                purchase.payment_term_days,
                                                purchase.due_date,
                                            )}
                                        </Text>
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Jatuh Tempo
                                    </Text>
                                    <div>
                                        <Text strong>
                                            {formatPurchaseDueDate(
                                                purchase.due_date,
                                            )}
                                        </Text>
                                        {overdueDays > 0 && (
                                            <Text
                                                type="danger"
                                                style={{
                                                    fontSize: 12,
                                                    display: "block",
                                                }}
                                            >
                                                terlambat {overdueDays} hari
                                            </Text>
                                        )}
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Total
                                    </Text>
                                    <div>
                                        <Text
                                            strong
                                            style={{
                                                color: "var(--semantic-success)",
                                            }}
                                        >
                                            {formatRupiah(purchase.total_amount)}
                                        </Text>
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Dibayar
                                    </Text>
                                    <div>
                                        <Text strong>
                                            {formatRupiah(paidAmount)}
                                        </Text>
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Sisa Utang
                                    </Text>
                                    <div>
                                        <Text
                                            strong
                                            style={{
                                                color:
                                                    remaining > 0
                                                        ? "var(--semantic-error)"
                                                        : undefined,
                                            }}
                                        >
                                            {formatRupiah(remaining)}
                                        </Text>
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Invoice">
                                    <Text
                                        strong
                                        style={{
                                            color: "var(--brand-primary)",
                                            fontSize: 16,
                                            display: "block",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {purchase.invoice}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Tanggal Pembelian
                                    </Text>
                                    <Text strong>
                                        {new Date(
                                            purchase.purchase_date,
                                        ).toLocaleDateString("id-ID")}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Supplier">
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        {purchase.supplier?.name || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: "block" }}
                                    >
                                        {purchase.supplier?.no_telp || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: "block" }}
                                    >
                                        {purchase.supplier?.email || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginTop: 8,
                                        }}
                                    >
                                        {purchase.supplier?.address || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Ringkasan">
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        Total Item: {purchase.total_items}
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        Total Qty: {purchase.total_qty}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        DPP
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        {formatRupiah(purchase.dpp_amount ?? 0)}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        PPN
                                        {purchase.tax_rate
                                            ? ` (${purchase.tax_rate}%)`
                                            : ""}
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        {formatRupiah(purchase.tax_amount ?? 0)}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Dibuat oleh: {purchase.user?.name || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                        </Row>

                        {purchase.note && (
                            <Card size="small" title="Catatan">
                                <Text>{purchase.note}</Text>
                            </Card>
                        )}

                        <Card title="Riwayat Pembayaran">
                            <Table
                                rowKey="id"
                                columns={paymentColumns}
                                dataSource={purchase.payments || []}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                locale={{
                                    emptyText:
                                        "Belum ada pembayaran tercatat untuk nota ini.",
                                }}
                            />
                        </Card>

                        <Card title="Detail Item">
                            <Table
                                rowKey="id"
                                columns={itemColumns}
                                dataSource={purchase.details}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                locale={{
                                    emptyText:
                                        "Belum ada item pada pembelian ini.",
                                }}
                            />
                        </Card>
                    </Space>

                    <Modal
                        title="Catat Pembayaran Supplier"
                        open={paymentModalOpen}
                        onCancel={() => setPaymentModalOpen(false)}
                        onOk={submitPayment}
                        okText="Simpan"
                        cancelText="Batal"
                        confirmLoading={loading}
                    >
                        <Form layout="vertical">
                            <Form.Item label="Tanggal Bayar" required>
                                <DatePicker
                                    style={{ width: "100%" }}
                                    format="YYYY-MM-DD"
                                    value={paidOn ? dayjs(paidOn) : null}
                                    onChange={(_, dateString) =>
                                        setPaidOn(dateString)
                                    }
                                />
                            </Form.Item>
                            <Form.Item
                                label={`Jumlah (maks. ${formatRupiah(remaining)})`}
                                required
                            >
                                <InputNumber
                                    min={1}
                                    max={remaining}
                                    style={{ width: "100%" }}
                                    value={payAmount}
                                    onChange={(value) =>
                                        setPayAmount(value ?? remaining)
                                    }
                                />
                            </Form.Item>
                            <Form.Item label="Metode" required>
                                <Select
                                    value={payMethod}
                                    onChange={setPayMethod}
                                    options={[
                                        { value: "tunai", label: "Tunai" },
                                        {
                                            value: "transfer",
                                            label: "Transfer",
                                        },
                                        {
                                            value: "lainnya",
                                            label: "Lainnya",
                                        },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item label="Catatan">
                                <Input.TextArea
                                    rows={2}
                                    value={payNote}
                                    onChange={(e) =>
                                        setPayNote(e.target.value)
                                    }
                                    placeholder="Opsional"
                                />
                            </Form.Item>
                        </Form>
                    </Modal>
                </Spin>
            </LayoutAccount>
        </>
    );
}
