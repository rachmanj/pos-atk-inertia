import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import hasAnyPermission from "../../../Utils/Permissions";
import {
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
    Statistic,
    Table,
    Typography,
} from "antd";
import {
    AccountBookOutlined,
    EyeOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ConsignmentPayablesIndex() {
    const { summary = {}, suppliers = [], flash = {}, auth = {} } =
        usePage().props;
    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [payTarget, setPayTarget] = useState(null);
    const [paidOn, setPaidOn] = useState(dayjs().format("YYYY-MM-DD"));
    const [payAmount, setPayAmount] = useState(null);
    const [payMethod, setPayMethod] = useState("tunai");
    const [payNote, setPayNote] = useState("");

    const openPayModal = (supplier) => {
        setPayTarget(supplier);
        setPaidOn(dayjs().format("YYYY-MM-DD"));
        setPayAmount(supplier.remaining_debt);
        setPayMethod("tunai");
        setPayNote("");
    };

    const closePayModal = () => setPayTarget(null);

    const submitPayment = () => {
        if (!payTarget) {
            return;
        }

        router.post(
            "/account/consignment-payments",
            {
                supplier_id: payTarget.id,
                paid_on: paidOn,
                amount: payAmount,
                method: payMethod,
                note: payNote || null,
            },
            {
                onSuccess: () => closePayModal(),
            },
        );
    };

    const columns = [
        {
            title: "No.",
            width: 56,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Supplier",
            dataIndex: "name",
            render: (value) => (
                <Text strong style={{ color: "var(--brand-primary)" }}>
                    {value}
                </Text>
            ),
        },
        {
            title: "Nilai Terjual",
            align: "right",
            responsive: ["md"],
            render: (_, record) => (
                <Text>{formatRupiahCompact(record.total_sold_value)}</Text>
            ),
        },
        {
            title: "Dibayar",
            align: "right",
            responsive: ["lg"],
            render: (_, record) => (
                <Text>{formatRupiahCompact(record.total_paid)}</Text>
            ),
        },
        {
            title: "Sisa Utang",
            align: "right",
            render: (_, record) => (
                <Text
                    strong
                    style={{
                        color:
                            record.remaining_debt > 0
                                ? "var(--semantic-error)"
                                : "var(--semantic-success)",
                    }}
                >
                    {formatRupiahCompact(record.remaining_debt)}
                </Text>
            ),
        },
        {
            title: "Belum Lunas",
            align: "center",
            width: 88,
            responsive: ["sm"],
            dataIndex: "unpaid_item_count",
            render: (value) => <Text strong>{value ?? 0}</Text>,
        },
        {
            title: "Aksi",
            width: 160,
            align: "center",
            render: (_, record) => (
                <Space wrap size="small">
                    <Link href={`/account/consignment-payables/${record.id}`}>
                        <Button size="small" icon={<EyeOutlined />}>
                            Detail
                        </Button>
                    </Link>
                    {hasAnyPermission(
                        ["consignment_payments.create"],
                        permissions,
                    ) &&
                        record.remaining_debt > 0 && (
                            <Button
                                size="small"
                                type="primary"
                                icon={<WalletOutlined />}
                                onClick={() => openPayModal(record)}
                            >
                                Bayar
                            </Button>
                        )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Utang Konsinyasi - VASIA Stationery" />

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <AccountBookOutlined
                                    style={{ color: "var(--brand-primary)" }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    UTANG KONSINYASI
                                </Title>
                            </Space>
                        }
                    >
                        {flash.success && (
                            <Alert
                                type="success"
                                message={flash.success}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                            <Col xs={24} sm={8}>
                                <Card
                                    size="small"
                                    style={{
                                        borderColor: "var(--brand-primary)",
                                        background:
                                            "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(16,185,129,0.04) 100%)",
                                    }}
                                >
                                    <Statistic
                                        title="Total Sisa Utang"
                                        value={formatRupiahCompact(
                                            summary.total_remaining || 0,
                                        )}
                                        valueStyle={{
                                            color: "var(--semantic-error)",
                                            fontSize: isMobile ? 20 : 24,
                                        }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={8}>
                                <Card size="small">
                                    <Statistic
                                        title="Supplier Berutang"
                                        value={summary.supplier_count || 0}
                                        valueStyle={{
                                            color: "var(--brand-primary)",
                                        }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12} sm={8}>
                                <Card size="small">
                                    <Statistic
                                        title="Item Belum Lunas"
                                        value={summary.unpaid_item_count || 0}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {isMobile ? (
                            <List
                                dataSource={suppliers}
                                locale={{
                                    emptyText:
                                        "Tidak ada utang konsinyasi aktif.",
                                }}
                                renderItem={(record) => (
                                    <List.Item
                                        key={record.id}
                                        actions={[
                                            <Link
                                                key="detail"
                                                href={`/account/consignment-payables/${record.id}`}
                                            >
                                                <Button
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                >
                                                    Detail
                                                </Button>
                                            </Link>,
                                            hasAnyPermission(
                                                [
                                                    "consignment_payments.create",
                                                ],
                                                permissions,
                                            ) &&
                                                record.remaining_debt > 0 && (
                                                    <Button
                                                        key="pay"
                                                        size="small"
                                                        type="primary"
                                                        icon={
                                                            <WalletOutlined />
                                                        }
                                                        onClick={() =>
                                                            openPayModal(record)
                                                        }
                                                    >
                                                        Bayar
                                                    </Button>
                                                ),
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <Text strong>
                                                    {record.name}
                                                </Text>
                                            }
                                            description={
                                                <Space
                                                    direction="vertical"
                                                    size={2}
                                                >
                                                    <Text type="secondary">
                                                        Terjual:{" "}
                                                        {formatRupiahCompact(
                                                            record.total_sold_value,
                                                        )}
                                                    </Text>
                                                    <Text type="secondary">
                                                        Dibayar:{" "}
                                                        {formatRupiahCompact(
                                                            record.total_paid,
                                                        )}
                                                    </Text>
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: "var(--semantic-error)",
                                                        }}
                                                    >
                                                        Sisa:{" "}
                                                        {formatRupiahCompact(
                                                            record.remaining_debt,
                                                        )}{" "}
                                                        · {record.unpaid_item_count}{" "}
                                                        item
                                                    </Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={suppliers}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                locale={{
                                    emptyText:
                                        "Tidak ada utang konsinyasi aktif.",
                                }}
                            />
                        )}
                    </Card>
                </Spin>

                <Modal
                    title={`Bayar Utang — ${payTarget?.name || ""}`}
                    open={!!payTarget}
                    onCancel={closePayModal}
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
                            label={`Nominal (maks. ${formatRupiah(payTarget?.remaining_debt || 0)})`}
                            required
                        >
                            <InputNumber
                                min={1}
                                max={payTarget?.remaining_debt || undefined}
                                style={{ width: "100%" }}
                                value={payAmount}
                                onChange={(value) =>
                                    setPayAmount(
                                        value ?? payTarget?.remaining_debt,
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