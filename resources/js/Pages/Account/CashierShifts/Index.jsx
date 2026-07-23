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
    Table,
    Tag,
    Typography,
} from "antd";
import {
    ClockCircleOutlined,
    DollarOutlined,
    EyeOutlined,
    LoginOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const statusColors = {
    open: "success",
    closed: "default",
};

const statusLabels = {
    open: "BUKA",
    closed: "TUTUP",
};

const dateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
};

export default function CashierShiftIndex() {
    const { activeShift, shifts, flash, auth } = usePage().props;
    const permissions = auth?.permissions || {};

    const columns = [
        {
            title: "No.",
            width: 60,
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
                value
                    ? new Date(value).toLocaleString(
                          "id-ID",
                          dateTimeFormatOptions,
                      )
                    : "-",
        },
        {
            title: "Waktu Tutup",
            dataIndex: "closed_at",
            render: (value) =>
                value
                    ? new Date(value).toLocaleString(
                          "id-ID",
                          dateTimeFormatOptions,
                      )
                    : "-",
        },
        {
            title: "Kas Awal",
            dataIndex: "cash_in_hand",
            render: (value) => <strong>{formatRupiah(value)}</strong>,
        },
        {
            title: "Kas Seharusnya",
            render: (_, record) =>
                formatRupiah(
                    record.status === "open"
                        ? record.summary.expected_cash
                        : record.expected_cash,
                ),
        },
        {
            title: "Kas Aktual",
            render: (_, record) =>
                record.status === "closed"
                    ? formatRupiah(record.actual_cash)
                    : "-",
        },
        {
            title: "Selisih",
            render: (_, record) =>
                record.status === "closed" ? (
                    <Text
                        strong
                        type={record.difference < 0 ? "danger" : undefined}
                    >
                        {formatRupiah(record.difference)}
                    </Text>
                ) : (
                    "-"
                ),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (status) => (
                <Tag color={statusColors[status] || "default"}>
                    {statusLabels[status] || status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Aksi",
            width: 100,
            align: "center",
            render: (_, record) => (
                <Link href={`/account/cashier-shifts/${record.id}`}>
                    <Button size="small" icon={<EyeOutlined />}>
                        Detail
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>Shift Kasir - ZenPOS</title>
            </Head>
            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    title={
                        <Title level={5} className="mb-0">
                            <ClockCircleOutlined className="me-2" />
                            SHIFT KASIR
                        </Title>
                    }
                    extra={
                        <div>
                            {!activeShift &&
                                hasAnyPermission(
                                    ["cashier_shifts.open"],
                                    permissions,
                                ) && (
                                    <Link href="/account/cashier-shifts/create">
                                        <Button
                                            type="primary"
                                            icon={<LoginOutlined />}
                                        >
                                            BUKA SHIFT
                                        </Button>
                                    </Link>
                                )}
                            {activeShift && (
                                <Link
                                    href={`/account/cashier-shifts/${activeShift.id}`}
                                >
                                    <Button
                                        type="primary"
                                        icon={<DollarOutlined />}
                                    >
                                        SHIFT AKTIF
                                    </Button>
                                </Link>
                            )}
                        </div>
                    }
                >
                    {flash.success && (
                        <Alert
                            type="success"
                            message={flash.success}
                            showIcon
                            className="mb-4"
                        />
                    )}
                    {flash.error && (
                        <Alert
                            type="error"
                            message={flash.error}
                            showIcon
                            className="mb-4"
                        />
                    )}

                    {activeShift ? (
                        <Card
                            className="border-0 bg-light shadow-sm rounded-3 mb-4"
                        >
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                                <div>
                                    <Text type="secondary" className="d-block mb-1">
                                        Shift aktif
                                    </Text>
                                    <Title level={4} className="mb-0">
                                        Dibuka{" "}
                                        {activeShift.opened_at
                                            ? new Date(
                                                  activeShift.opened_at,
                                              ).toLocaleString(
                                                  "id-ID",
                                                  dateTimeFormatOptions,
                                              )
                                            : "-"}
                                    </Title>
                                </div>
                                <Tag color="success" className="px-3 py-1">
                                    BUKA
                                </Tag>
                            </div>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12} md={6}>
                                    <div className="border rounded-3 bg-white p-3 h-100">
                                        <Text type="secondary" className="small">
                                            Kas Awal
                                        </Text>
                                        <div className="fw-bold">
                                            {formatRupiah(
                                                activeShift.cash_in_hand,
                                            )}
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <div className="border rounded-3 bg-white p-3 h-100">
                                        <Text type="secondary" className="small">
                                            Penjualan Tunai
                                        </Text>
                                        <div className="fw-bold text-success">
                                            {formatRupiah(
                                                activeShift.summary.cash_sales,
                                            )}
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <div className="border rounded-3 bg-white p-3 h-100">
                                        <Text type="secondary" className="small">
                                            Refund Tunai
                                        </Text>
                                        <div className="fw-bold text-danger">
                                            {formatRupiah(
                                                activeShift.summary
                                                    .cash_refunds,
                                            )}
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <div className="border rounded-3 bg-white p-3 h-100">
                                        <Text type="secondary" className="small">
                                            Kas Seharusnya
                                        </Text>
                                        <div className="fw-bold text-primary">
                                            {formatRupiah(
                                                activeShift.summary
                                                    .expected_cash,
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    ) : (
                        <Alert
                            type="warning"
                            showIcon
                            className="mb-4"
                            message="Belum ada shift aktif. Buka shift sebelum mulai transaksi kasir."
                        />
                    )}

                    <Table
                        bordered
                        rowKey="id"
                        columns={columns}
                        dataSource={shifts.data}
                        pagination={false}
                        locale={{
                            emptyText: "Belum ada histori shift kasir.",
                        }}
                        scroll={{ x: 1100 }}
                    />

                    <Pagination
                        links={shifts.links}
                        align="end"
                        meta={{
                            current_page: shifts.current_page,
                            per_page: shifts.per_page,
                            total: shifts.total,
                        }}
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
