import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, TEAL } from "../../../theme/colors";
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    Modal,
    Row,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    Typography,
    notification,
} from "antd";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    EyeOutlined,
    FallOutlined,
    LoginOutlined,
    MoneyCollectOutlined,
    RiseOutlined,
    ShoppingOutlined,
    UndoOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const statusColors = { open: "success", closed: "default" };
const statusLabels = { open: "BUKA", closed: "TUTUP" };

const statIconColors = {
    primary: "var(--semantic-info)",
    success: "var(--semantic-success)",
    teal: BRAND.primary,
};

const dateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
};

function StatCard({ title, value, icon, color = "primary" }) {
    const iconColor = statIconColors[color] || statIconColors.primary;

    return (
        <Card>
            <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <Statistic
                    title={
                        <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase" }}>
                            {title}
                        </Text>
                    }
                    value={value}
                    valueStyle={{ fontSize: 22, fontWeight: 700 }}
                />
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        background: `${iconColor}1a`,
                        color: iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
            </Space>
        </Card>
    );
}

export default function CashierShiftIndex() {
    const { activeShift, shifts, flash, auth, summary = {}, canReopen = false } =
        usePage().props;
    const permissions = auth?.permissions || {};
    const loading = useInertiaLoading();

    const [reopenShiftId, setReopenShiftId] = useState(null);
    const [reopenReason, setReopenReason] = useState("");
    const [reopenLoading, setReopenLoading] = useState(false);

    const closeReopenModal = () => {
        if (!reopenLoading) {
            setReopenShiftId(null);
            setReopenReason("");
        }
    };

    const submitReopen = () => {
        const reason = String(reopenReason || "").trim();
        if (reason.length < 3) {
            notification.error({
                message: "Validasi gagal",
                description: "Alasan pembukaan kembali wajib diisi (minimal 3 karakter).",
            });
            return;
        }

        setReopenLoading(true);
        router.put(
            `/account/cashier-shifts/${reopenShiftId}/reopen`,
            { reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReopenShiftId(null);
                    setReopenReason("");
                    notification.success({
                        message: "Berhasil",
                        description: "Shift berhasil dibuka kembali.",
                    });
                },
                onError: () => {
                    notification.error({
                        message: "Gagal",
                        description:
                            "Shift tidak dapat dibuka kembali. Periksa hak akses dan data.",
                    });
                },
                onFinish: () => setReopenLoading(false),
            },
        );
    };

    const canOpenShift =
        !activeShift && hasAnyPermission(["cashier_shifts.open"], permissions);

    const headerAction = canOpenShift ? (
        <Link href="/account/cashier-shifts/create">
            <Button type="primary" size="large" icon={<LoginOutlined />}>
                BUKA SHIFT
            </Button>
        </Link>
    ) : activeShift ? (
        <Link href={`/account/cashier-shifts/${activeShift.id}`}>
            <Button type="primary" size="large" icon={<CheckCircleOutlined />}>
                SHIFT AKTIF
            </Button>
        </Link>
    ) : null;

    const columns = [
        {
            title: "No.",
            width: 50,
            align: "center",
            fixed: "left",
            render: (_, __, index) =>
                index + 1 + (shifts.current_page - 1) * shifts.per_page,
        },
        {
            title: "Kasir",
            dataIndex: ["user", "name"],
            width: 120,
            render: (value) => value || "-",
        },
        {
            title: "Waktu Buka",
            dataIndex: "opened_at",
            width: 180,
            render: (value) =>
                value
                    ? new Date(value).toLocaleString("id-ID", dateTimeFormatOptions)
                    : "-",
        },
        {
            title: "Waktu Tutup",
            dataIndex: "closed_at",
            width: 180,
            render: (value) =>
                value
                    ? new Date(value).toLocaleString("id-ID", dateTimeFormatOptions)
                    : "-",
        },
        {
            title: "Kas Awal",
            dataIndex: "cash_in_hand",
            width: 120,
            align: "right",
            render: (value) => <Text strong>{formatRupiah(value)}</Text>,
        },
        {
            title: "Kas Seharusnya",
            width: 130,
            align: "right",
            render: (_, record) =>
                formatRupiah(
                    record.status === "open"
                        ? record.summary?.expected_cash
                        : record.expected_cash,
                ),
        },
        {
            title: "Kas Aktual",
            width: 120,
            align: "right",
            render: (_, record) =>
                record.status === "closed" ? formatRupiah(record.actual_cash) : "-",
        },
        {
            title: "Selisih",
            width: 120,
            align: "right",
            render: (_, record) =>
                record.status === "closed" ? (
                    <Text strong type={record.difference < 0 ? "danger" : "success"}>
                        {formatRupiah(record.difference)}
                    </Text>
                ) : (
                    "-"
                ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 80,
            align: "center",
            render: (status) => (
                <Tag color={statusColors[status] || "default"}>
                    {statusLabels[status] || status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Aksi",
            width: canReopen ? 100 : 70,
            align: "center",
            fixed: "right",
            render: (_, record) => (
                <Space size={4}>
                    <Link href={`/account/cashier-shifts/${record.id}`}>
                        <Button size="small" type="text" icon={<EyeOutlined />} title="Detail" />
                    </Link>
                    {canReopen && record.status === "closed" && (
                        <Button
                            size="small"
                            type="text"
                            icon={<UndoOutlined />}
                            title="Buka Kembali"
                            onClick={() => setReopenShiftId(record.id)}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>Shift Kasir - VASIA Stationery</title>
            </Head>
            <LayoutAccount>
                <Spin spinning={loading}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <Row align="middle" gutter={[16, 16]}>
                        <Col flex="auto">
                            <Space>
                                <ClockCircleOutlined style={{ fontSize: 24, color: "var(--brand-primary)" }} />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        Shift Kasir
                                    </Title>
                                    <Text type="secondary">
                                        Kelola buka/tutup shift dan histori kas
                                    </Text>
                                </div>
                            </Space>
                        </Col>
                        {headerAction && (
                            <Col>
                                {headerAction}
                            </Col>
                        )}
                    </Row>

                    {flash.success && (
                        <Alert type="success" message={flash.success} showIcon />
                    )}
                    {flash.error && (
                        <Alert type="error" message={flash.error} showIcon />
                    )}

                    <Row gutter={[12, 12]}>
                        <Col xs={12} md={8}>
                            <StatCard
                                title="Total Shift"
                                value={summary.total_shifts ?? shifts.total ?? 0}
                                icon={<UnorderedListOutlined />}
                                color="primary"
                            />
                        </Col>
                        <Col xs={12} md={8}>
                            <StatCard
                                title="Shift Buka"
                                value={summary.open_shifts ?? 0}
                                icon={<CheckCircleOutlined />}
                                color="success"
                            />
                        </Col>
                        <Col xs={12} md={8}>
                            <StatCard
                                title="Total Penjualan"
                                value={formatRupiah(summary.total_sales ?? 0)}
                                icon={<ShoppingOutlined />}
                                color="teal"
                            />
                        </Col>
                    </Row>

                    {activeShift ? (
                        <Card
                            style={{
                                background: `linear-gradient(135deg, ${TEAL[50]} 0%, ${TEAL[100]} 100%)`,
                                border: "1px solid #5eead4",
                            }}
                        >
                            <Space
                                style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
                                align="start"
                                wrap
                            >
                                <Space>
                                    <CheckCircleOutlined style={{ fontSize: 28, color: "var(--brand-primary)" }} />
                                    <div>
                                        <Text strong style={{ color: TEAL[700], fontSize: 13 }}>
                                            SHIFT AKTIF
                                        </Text>
                                        <Title level={4} style={{ margin: 0, color: TEAL[900] }}>
                                            Dibuka{" "}
                                            {activeShift.opened_at
                                                ? new Date(activeShift.opened_at).toLocaleString(
                                                      "id-ID",
                                                      dateTimeFormatOptions,
                                                  )
                                                : "-"}
                                        </Title>
                                    </div>
                                </Space>
                                <Tag color="success" style={{ fontSize: 13, padding: "4px 12px" }}>
                                    BUKA
                                </Tag>
                            </Space>
                            <Row gutter={[12, 12]}>
                                <Col xs={12} sm={12} md={6}>
                                    <Card size="small">
                                        <Statistic
                                            title="Kas Awal"
                                            value={activeShift.cash_in_hand}
                                            prefix={<MoneyCollectOutlined />}
                                            formatter={(v) => formatRupiah(v)}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12} sm={12} md={6}>
                                    <Card size="small">
                                        <Statistic
                                            title="Penjualan Tunai"
                                            value={activeShift.summary?.cash_sales || 0}
                                            prefix={<RiseOutlined />}
                                            valueStyle={{ color: "var(--semantic-success)" }}
                                            formatter={(v) => formatRupiah(v)}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12} sm={12} md={6}>
                                    <Card size="small">
                                        <Statistic
                                            title="Refund Tunai"
                                            value={activeShift.summary?.cash_refunds || 0}
                                            prefix={<FallOutlined />}
                                            valueStyle={{ color: "var(--semantic-error)" }}
                                            formatter={(v) => formatRupiah(v)}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12} sm={12} md={6}>
                                    <Card size="small">
                                        <Statistic
                                            title="Kas Seharusnya"
                                            value={activeShift.summary?.expected_cash || 0}
                                            prefix={<DollarOutlined />}
                                            valueStyle={{ color: "var(--brand-primary)" }}
                                            formatter={(v) => formatRupiah(v)}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </Card>
                    ) : (
                        <Alert
                            type="warning"
                            showIcon
                            message="Belum ada shift aktif"
                            description="Buka shift sebelum mulai transaksi kasir."
                        />
                    )}

                    <Card
                        title={
                            <Space>
                                <UnorderedListOutlined style={{ color: "var(--icon-muted)" }} />
                                <span>Histori Shift</span>
                            </Space>
                        }
                    >
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={shifts.data}
                            pagination={false}
                            size="middle"
                            scroll={{ x: 1100 }}
                            locale={{
                                emptyText:
                                    "Belum ada histori shift. Buka shift pertama untuk mulai transaksi kasir.",
                            }}
                        />

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={shifts.links}
                                align="end"
                                meta={{
                                    current_page: shifts.current_page,
                                    per_page: shifts.per_page,
                                    total: shifts.total,
                                }}
                            />
                        </div>
                    </Card>
                </Space>
                </Spin>

                <Modal
                    title="Buka Kembali Shift"
                    open={reopenShiftId !== null}
                    onCancel={closeReopenModal}
                    onOk={submitReopen}
                    okText="Buka Kembali"
                    confirmLoading={reopenLoading}
                    destroyOnClose
                >
                    <Form layout="vertical">
                        <Form.Item
                            label="Alasan"
                            required
                            help="Wajib diisi untuk jejak audit (minimal 3 karakter)."
                        >
                            <Input.TextArea
                                rows={4}
                                value={reopenReason}
                                onChange={(e) => setReopenReason(e.target.value)}
                                placeholder="Contoh: perlu koreksi pengeluaran dari laci sebelum tutup."
                                maxLength={255}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </LayoutAccount>
        </>
    );
}
