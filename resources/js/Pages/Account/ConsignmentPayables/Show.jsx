import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import hasAnyPermission from "../../../Utils/Permissions";
import {
    formatDateOnly,
    formatRupiah,
    formatRupiahCompact,
} from "../../../Utils/format";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Grid,
    Input,
    InputNumber,
    List,
    Modal,
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
    AccountBookOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const methodLabel = (method) =>
    method === "transfer" ? "Transfer" : "Tunai";

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

export default function ConsignmentPayableShow() {
    const {
        supplier = {},
        totals = {},
        unpaid_lines = [],
        payments = [],
        flash = {},
        auth = {},
    } = usePage().props;
    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const canPay =
        hasAnyPermission(["consignment_payments.create"], permissions) &&
        (totals.remaining_debt || 0) > 0;

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paidOn, setPaidOn] = useState(dayjs().format("YYYY-MM-DD"));
    const [payAmount, setPayAmount] = useState(totals.remaining_debt || 0);
    const [payMethod, setPayMethod] = useState("tunai");
    const [payNote, setPayNote] = useState("");

    const openPaymentModal = () => {
        setPaidOn(dayjs().format("YYYY-MM-DD"));
        setPayAmount(totals.remaining_debt || 0);
        setPayMethod("tunai");
        setPayNote("");
        setPaymentModalOpen(true);
    };

    const submitPayment = () => {
        router.post(
            "/account/consignment-payments",
            {
                supplier_id: supplier.id,
                paid_on: paidOn,
                amount: payAmount,
                method: payMethod,
                note: payNote || null,
            },
            {
                onSuccess: () => setPaymentModalOpen(false),
            },
        );
    };

    const lineColumns = [
        {
            title: "Penerimaan",
            render: (_, row) => (
                <Space direction="vertical" size={0}>
                    <Link
                        href={`/account/consignments/${row.consignment_id}`}
                        style={{ color: "var(--brand-primary)" }}
                    >
                        <Text strong>{row.consignment_code}</Text>
                    </Link>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateOnly(row.received_date)}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Produk",
            render: (_, row) => (
                <div>
                    <Text strong>{row.product?.title || "-"}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {row.product?.unit || "-"}
                    </Text>
                </div>
            ),
        },
        {
            title: "Terjual",
            align: "center",
            dataIndex: "qty_sold",
            width: 72,
        },
        {
            title: "Harga",
            align: "right",
            responsive: ["md"],
            render: (_, row) => formatRupiahCompact(row.cost_price),
        },
        {
            title: "Terbayar",
            align: "right",
            responsive: ["lg"],
            render: (_, row) => formatRupiahCompact(row.paid_amount),
        },
        {
            title: "Sisa Qty",
            align: "center",
            dataIndex: "remaining_qty",
            width: 80,
        },
        {
            title: "Sisa Nilai",
            align: "right",
            render: (_, row) => (
                <Text
                    strong
                    style={{ color: "var(--semantic-error)" }}
                >
                    {formatRupiahCompact(row.remaining_value)}
                </Text>
            ),
        },
    ];

    const paymentColumns = [
        {
            title: "Tanggal",
            dataIndex: "paid_on",
            render: (value) => formatDateOnly(value),
        },
        {
            title: "Nominal",
            align: "right",
            dataIndex: "amount",
            render: (value) => (
                <Text strong style={{ color: "var(--semantic-success)" }}>
                    {formatRupiahCompact(value)}
                </Text>
            ),
        },
        {
            title: "Metode",
            dataIndex: "method",
            responsive: ["sm"],
            render: (value) => <Tag>{methodLabel(value)}</Tag>,
        },
        {
            title: "Oleh",
            responsive: ["md"],
            render: (_, row) => row.user?.name || "-",
        },
        {
            title: "Catatan",
            dataIndex: "note",
            responsive: ["lg"],
            ellipsis: true,
            render: (value) => value || "-",
        },
    ];

    return (
        <>
            <Head title={`Utang Konsinyasi — ${supplier.name} - VASIA`} />

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                        {flash.success && (
                            <Alert
                                type="success"
                                message={flash.success}
                                showIcon
                            />
                        )}

                        <Card
                            title={
                                <Space>
                                    <AccountBookOutlined
                                        style={{ color: "var(--brand-primary)" }}
                                    />
                                    <Title level={4} style={{ margin: 0 }}>
                                        {supplier.name?.toUpperCase()}
                                    </Title>
                                </Space>
                            }
                            extra={
                                <Space wrap>
                                    <Link href="/account/consignment-payables">
                                        <Button icon={<ArrowLeftOutlined />}>
                                            Kembali
                                        </Button>
                                    </Link>
                                    {canPay && (
                                        <Button
                                            type="primary"
                                            icon={<WalletOutlined />}
                                            onClick={openPaymentModal}
                                        >
                                            Bayar
                                        </Button>
                                    )}
                                </Space>
                            }
                        >
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={6}>
                                    <InfoCard label="Nilai Terjual">
                                        <Text strong>
                                            {formatRupiahCompact(
                                                totals.total_sold_value,
                                            )}
                                        </Text>
                                    </InfoCard>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <InfoCard label="Total Dibayar">
                                        <Text strong>
                                            {formatRupiahCompact(
                                                totals.total_paid,
                                            )}
                                        </Text>
                                    </InfoCard>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <InfoCard label="Sisa Utang">
                                        <Text
                                            strong
                                            style={{
                                                color:
                                                    (totals.remaining_debt ||
                                                        0) > 0
                                                        ? "var(--semantic-error)"
                                                        : "var(--semantic-success)",
                                            }}
                                        >
                                            {formatRupiahCompact(
                                                totals.remaining_debt,
                                            )}
                                        </Text>
                                    </InfoCard>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <InfoCard label="Item Belum Lunas">
                                        <Text strong>
                                            {totals.unpaid_item_count ?? 0}
                                        </Text>
                                    </InfoCard>
                                </Col>
                            </Row>
                        </Card>

                        <Card
                            size="small"
                            title="Baris Titipan Terjual — Belum Lunas"
                        >
                            {isMobile ? (
                                <List
                                    dataSource={unpaid_lines}
                                    locale={{
                                        emptyText:
                                            "Semua utang untuk baris terjual sudah lunas.",
                                    }}
                                    renderItem={(row) => (
                                        <List.Item key={row.consignment_item_id}>
                                            <List.Item.Meta
                                                title={
                                                    <Text strong>
                                                        {row.product?.title}
                                                    </Text>
                                                }
                                                description={
                                                    <Space
                                                        direction="vertical"
                                                        size={2}
                                                    >
                                                        <Text type="secondary">
                                                            {row.consignment_code}{" "}
                                                            ·{" "}
                                                            {formatDateOnly(
                                                                row.received_date,
                                                            )}
                                                        </Text>
                                                        <Text>
                                                            Terjual {row.qty_sold}{" "}
                                                            · Sisa qty{" "}
                                                            {row.remaining_qty}
                                                        </Text>
                                                        <Text
                                                            strong
                                                            style={{
                                                                color: "var(--semantic-error)",
                                                            }}
                                                        >
                                                            Sisa{" "}
                                                            {formatRupiahCompact(
                                                                row.remaining_value,
                                                            )}
                                                        </Text>
                                                    </Space>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Table
                                    rowKey="consignment_item_id"
                                    columns={lineColumns}
                                    dataSource={unpaid_lines}
                                    pagination={false}
                                    scroll={{ x: "max-content" }}
                                    locale={{
                                        emptyText:
                                            "Semua utang untuk baris terjual sudah lunas.",
                                    }}
                                />
                            )}
                        </Card>

                        <Card size="small" title="Riwayat Pembayaran">
                            <Table
                                rowKey="id"
                                columns={paymentColumns}
                                dataSource={payments}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                locale={{
                                    emptyText:
                                        "Belum ada pembayaran utang konsinyasi untuk supplier ini.",
                                }}
                            />
                        </Card>
                    </Space>
                </Spin>

                <Modal
                    title="Catat Pembayaran Utang Konsinyasi"
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
                            label={`Nominal (maks. ${formatRupiah(totals.remaining_debt || 0)})`}
                            required
                        >
                            <InputNumber
                                min={1}
                                max={totals.remaining_debt || undefined}
                                style={{ width: "100%" }}
                                value={payAmount}
                                onChange={(value) =>
                                    setPayAmount(
                                        value ?? totals.remaining_debt,
                                    )
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
                                ]}
                            />
                        </Form.Item>
                        <Form.Item label="Catatan">
                            <Input.TextArea
                                rows={2}
                                value={payNote}
                                onChange={(e) => setPayNote(e.target.value)}
                                placeholder="Opsional"
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </LayoutAccount>
        </>
    );
}