import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import {
    Alert,
    Button,
    Card,
    Col,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    ClockCircleOutlined,
    DollarOutlined,
    EyeOutlined,
    LoginOutlined,
    MoneyCollectOutlined,
    RiseOutlined,
    FallOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const statusColors = { open: "success", closed: "default" };
const statusLabels = { open: "BUKA", closed: "TUTUP" };

const dateTimeFormatOptions = {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
};

export default function CashierShiftIndex() {
    const { activeShift, shifts, flash, auth } = usePage().props;
    const permissions = auth?.permissions || {};

    const columns = [
        {
            title: "No.",
            width: 50,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (shifts.current_page - 1) * shifts.per_page,
        },
        {
            title: "Kasir",
            render: (_, record) => record.user?.name || "-",
        },
        {
            title: "Waktu Buka",
            dataIndex: "opened_at",
            render: (value) =>
                value ? new Date(value).toLocaleString("id-ID", dateTimeFormatOptions) : "-",
        },
        {
            title: "Waktu Tutup",
            dataIndex: "closed_at",
            render: (value) =>
                value ? new Date(value).toLocaleString("id-ID", dateTimeFormatOptions) : "-",
        },
        {
            title: "Kas Awal",
            dataIndex: "cash_in_hand",
            align: "right",
            render: (value) => <Text strong>{formatRupiah(value)}</Text>,
        },
        {
            title: "Kas Seharusnya",
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
            align: "right",
            render: (_, record) =>
                record.status === "closed" ? formatRupiah(record.actual_cash) : "-",
        },
        {
            title: "Selisih",
            align: "right",
            render: (_, record) =>
                record.status === "closed" ? (
                    <Text strong type={record.difference < 0 ? "danger" : "success"}>
                        {formatRupiah(record.difference)}
                    </Text>
                ) : ("-"),
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
            width: 80,
            align: "center",
            render: (_, record) => (
                <Link href={`/account/cashier-shifts/${record.id}`}>
                    <Button size="small" icon={<EyeOutlined />} />
                </Link>
            ),
        },
    ];

    return (
        <>
            <Head><title>Shift Kasir - ZenPOS</title></Head>
            <LayoutAccount>
                <Card
                    title={
                        <Space>
                            <ClockCircleOutlined style={{ color: "#0d9488" }} />
                            <span>SHIFT KASIR</span>
                        </Space>
                    }
                    extra={
                        !activeShift && hasAnyPermission(["cashier_shifts.open"], permissions) ? (
                            <Link href="/account/cashier-shifts/create">
                                <Button type="primary" icon={<LoginOutlined />}>BUKA SHIFT</Button>
                            </Link>
                        ) : activeShift ? (
                            <Link href={`/account/cashier-shifts/${activeShift.id}`}>
                                <Button type="primary" icon={<DollarOutlined />}>SHIFT AKTIF</Button>
                            </Link>
                        ) : null
                    }
                >
                    {flash.success && (
                        <Alert type="success" message={flash.success} showIcon style={{ marginBottom: 16 }} />
                    )}
                    {flash.error && (
                        <Alert type="error" message={flash.error} showIcon style={{ marginBottom: 16 }} />
                    )}

                    {activeShift ? (
                        <Card style={{ marginBottom: 16, background: "#f8fafc" }}>
                            <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }} wrap>
                                <div>
                                    <Text type="secondary">Shift aktif</Text>
                                    <Title level={4} style={{ margin: 0 }}>
                                        Dibuka{" "}
                                        {activeShift.opened_at
                                            ? new Date(activeShift.opened_at).toLocaleString("id-ID", dateTimeFormatOptions)
                                            : "-"}
                                    </Title>
                                </div>
                                <Tag color="success" style={{ fontSize: 14, padding: "2px 12px" }}>BUKA</Tag>
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
                                            valueStyle={{ color: "#22c55e" }}
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
                                            valueStyle={{ color: "#ef4444" }}
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
                                            valueStyle={{ color: "#0d9488" }}
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
                            style={{ marginBottom: 16 }}
                            message="Belum ada shift aktif. Buka shift sebelum mulai transaksi kasir."
                        />
                    )}

                    <Table
                        bordered
                        rowKey="id"
                        columns={columns}
                        dataSource={shifts.data}
                        pagination={false}
                        size="small"
                        scroll={{ x: 900 }}
                        locale={{ emptyText: "Belum ada histori shift kasir." }}
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
            </LayoutAccount>
        </>
    );
}
