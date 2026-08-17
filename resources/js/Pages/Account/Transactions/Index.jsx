import Pagination from "../../../Shared/Pagination";
import LayoutAccount from "../../../Layouts/Account";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import hasAnyPermission from "../../../Utils/Permissions";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, NEUTRAL, SEMANTIC } from "../../../theme/colors";
import {
    Alert,
    Button,
    Card,
    Col,
    Input,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    EyeOutlined,
    FilterOutlined,
    ReloadOutlined,
    ShoppingCartOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const paymentMethodLabel = (method) => {
    const labels = {
        cash: "Tunai",
        digital: "Digital",
        qris: "QRIS",
        transfer: "Transfer",
    };
    return labels[method] || method || "-";
};

const paymentStatusLabel = (status) => {
    const labels = {
        unpaid: "Belum Bayar",
        paid: "Lunas",
        pending: "Pending",
        failed: "Gagal",
        expired: "Expired",
    };
    return labels[status] || "-";
};

const paymentStatusColor = (status) => {
    const colors = {
        unpaid: "default",
        paid: "success",
        pending: "warning",
        failed: "error",
        expired: "default",
    };
    return colors[status] || "default";
};

const isTransferPending = (record) =>
    record.payment_method === "transfer" &&
    record.payment_status === "pending" &&
    record.status === "pending";

const transactionStatusLabel = (status, record) => {
    if (record && isTransferPending(record)) {
        return "Menunggu Konfirmasi";
    }

    const labels = {
        completed: "Selesai",
        pending: "Pending",
        voided: "Dibatalkan",
    };
    return labels[status] || "-";
};

const transactionStatusColor = (status, record) => {
    if (record && isTransferPending(record)) {
        return "warning";
    }

    const colors = {
        completed: "success",
        pending: "warning",
        voided: "error",
    };
    return colors[status] || "default";
};

export default function Index() {
    const {
        transactions,
        filters = {},
        flash = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();

    const [search, setSearch] = useState(filters.search || "");
    const [paymentMethod, setPaymentMethod] = useState(
        filters.payment_method || undefined,
    );
    const [paymentStatus, setPaymentStatus] = useState(
        filters.payment_status || undefined,
    );

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/transactions", {
            search,
            payment_method: paymentMethod || "",
            payment_status: paymentStatus || "",
        });
    };

    const handleReset = () => {
        setSearch("");
        setPaymentMethod(undefined);
        setPaymentStatus(undefined);
        router.get("/account/transactions");
    };

    const formatDate = (date) =>
        new Date(date).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (transactions.current_page - 1) * transactions.per_page,
        },
        {
            title: "Invoice",
            dataIndex: "invoice",
            render: (invoice, record) => (
                <Link href={`/account/transactions/${invoice}`}>
                    <Text
                        strong
                        style={{
                            color:
                                record.status === "voided"
                                    ? SEMANTIC.error
                                    : BRAND.primary,
                        }}
                    >
                        {invoice}
                    </Text>
                </Link>
            ),
        },
        {
            title: "Tanggal",
            dataIndex: "created_at",
            render: (value) => formatDate(value),
        },
        {
            title: "Kasir",
            render: (_, record) => record.cashier?.name || "-",
        },
        {
            title: "Customer",
            render: (_, record) => record.customer?.name || "Umum",
        },
        {
            title: "Metode",
            align: "center",
            dataIndex: "payment_method",
            render: (method) => <Tag>{paymentMethodLabel(method)}</Tag>,
        },
        {
            title: "Pembayaran",
            align: "center",
            dataIndex: "payment_status",
            render: (status) => (
                <Tag color={paymentStatusColor(status)}>
                    {paymentStatusLabel(status)}
                </Tag>
            ),
        },
        {
            title: "Status Transaksi",
            align: "center",
            dataIndex: "status",
            render: (status, record) => (
                <Tag color={transactionStatusColor(status, record)}>
                    {transactionStatusLabel(status, record)}
                </Tag>
            ),
        },
        {
            title: "Total",
            align: "right",
            dataIndex: "grand_total",
            render: (value) => (
                <Text strong style={{ color: SEMANTIC.success }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
        {
            title: "Aksi",
            width: 180,
            align: "center",
            render: (_, record) => (
                <Space size="small">
                    {hasAnyPermission(["transactions.show"], permissions) && (
                        <Link href={`/account/transactions/${record.invoice}`}>
                            <Button size="small" icon={<EyeOutlined />}>
                                Detail
                            </Button>
                        </Link>
                    )}
                    {isTransferPending(record) &&
                        hasAnyPermission(
                            ["transactions.edit"],
                            permissions,
                        ) && (
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() =>
                                    router.post(
                                        `/account/transactions/${record.invoice}/confirm-transfer`,
                                    )
                                }
                            >
                                Konfirmasi
                            </Button>
                        )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>Riwayat Transaksi - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Title level={4} style={{ margin: 0 }}>
                                RIWAYAT TRANSAKSI
                            </Title>
                        }
                        extra={
                            hasAnyPermission(
                                ["transactions.create"],
                                permissions,
                            ) && (
                                <Link href="/account/transactions/create">
                                    <Button
                                        type="primary"
                                        icon={<ShoppingCartOutlined />}
                                    >
                                        POS KASIR
                                    </Button>
                                </Link>
                            )
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
                        {flash.error && (
                            <Alert
                                type="error"
                                message={flash.error}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <form
                            onSubmit={handleFilter}
                            style={{ marginBottom: 16 }}
                        >
                            <Row gutter={[12, 12]}>
                                <Col xs={24} lg={8}>
                                    <Input
                                        placeholder="Cari invoice, kasir, atau customer..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                    />
                                </Col>
                                <Col xs={24} sm={12} lg={5}>
                                    <Select
                                        allowClear
                                        placeholder="Semua Metode"
                                        style={{ width: "100%" }}
                                        value={paymentMethod}
                                        onChange={setPaymentMethod}
                                        options={[
                                            { value: "cash", label: "Tunai" },
                                            {
                                                value: "digital",
                                                label: "Digital",
                                            },
                                            { value: "qris", label: "QRIS" },
                                            {
                                                value: "transfer",
                                                label: "Transfer",
                                            },
                                        ]}
                                    />
                                </Col>
                                <Col xs={24} sm={12} lg={5}>
                                    <Select
                                        allowClear
                                        placeholder="Semua Pembayaran"
                                        style={{ width: "100%" }}
                                        value={paymentStatus}
                                        onChange={setPaymentStatus}
                                        options={[
                                            {
                                                value: "unpaid",
                                                label: "Belum Bayar",
                                            },
                                            {
                                                value: "pending",
                                                label: "Pending",
                                            },
                                            { value: "paid", label: "Lunas" },
                                            {
                                                value: "failed",
                                                label: "Gagal",
                                            },
                                            {
                                                value: "expired",
                                                label: "Expired",
                                            },
                                        ]}
                                    />
                                </Col>
                                <Col xs={24} lg={6}>
                                    <Space>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<FilterOutlined />}
                                        >
                                            Filter
                                        </Button>
                                        <Button
                                            icon={<ReloadOutlined />}
                                            onClick={handleReset}
                                        >
                                            Reset
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </form>

                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={transactions.data}
                            pagination={false}
                            scroll={{ x: "max-content" }}
                            onRow={(record) =>
                                record.status === "voided"
                                    ? {
                                          style: {
                                              background: NEUTRAL.slate50,
                                          },
                                      }
                                    : {}
                            }
                            locale={{
                                emptyText:
                                    "Belum ada transaksi. Buka POS Kasir untuk mencatat penjualan pertama.",
                            }}
                        />

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={transactions.links}
                                align="end"
                                meta={{
                                    current_page: transactions.current_page,
                                    per_page: transactions.per_page,
                                    total: transactions.total,
                                }}
                            />
                        </div>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
