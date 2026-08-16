import Pagination from "../../../Shared/Pagination";
import LayoutAccount from "../../../Layouts/Account";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Input,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    EyeOutlined,
    FilterOutlined,
    ReloadOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import hasAnyPermission from "../../../Utils/Permissions";

const { Title } = Typography;

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

const transactionStatusLabel = (status) => {
    const labels = {
        completed: "Selesai",
        pending: "Pending",
        voided: "Dibatalkan",
    };
    return labels[status] || "-";
};

const transactionStatusColor = (status) => {
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
                    <strong
                        className={
                            record.status === "voided"
                                ? "text-danger"
                                : "text-primary"
                        }
                    >
                        {invoice}
                    </strong>
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
            render: (status) => (
                <Tag color={transactionStatusColor(status)}>
                    {transactionStatusLabel(status)}
                </Tag>
            ),
        },
        {
            title: "Total",
            align: "right",
            dataIndex: "grand_total",
            render: (value) => (
                <strong className="text-success">{formatRupiah(value)}</strong>
            ),
        },
        {
            title: "Aksi",
            width: 100,
            align: "center",
            render: (_, record) =>
                hasAnyPermission(["transactions.show"], permissions) ? (
                    <Link href={`/account/transactions/${record.invoice}`}>
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                        >
                            Detail
                        </Button>
                    </Link>
                ) : null,
        },
    ];

    return (
        <>
            <Head title="Riwayat Transaksi" />

            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    title={
                        <Title level={5} className="mb-0">
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

                    <form onSubmit={handleFilter} className="mb-4">
                        <Row gutter={[12, 12]}>
                            <Col xs={24} lg={8}>
                                <Input
                                    placeholder="Cari invoice, kasir, atau customer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={5}>
                                <Select
                                    allowClear
                                    placeholder="Semua Metode"
                                    className="w-100"
                                    value={paymentMethod}
                                    onChange={setPaymentMethod}
                                    options={[
                                        { value: "cash", label: "Tunai" },
                                        { value: "digital", label: "Digital" },
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
                                    className="w-100"
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
                                        { value: "failed", label: "Gagal" },
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
                        bordered
                        rowKey="id"
                        columns={columns}
                        dataSource={transactions.data}
                        pagination={false}
                        locale={{
                            emptyText:
                                "Belum ada transaksi. Buka POS Kasir untuk mencatat penjualan pertama.",
                        }}
                        rowClassName={(record) =>
                            record.status === "voided" ? "table-light" : ""
                        }
                        scroll={{ x: 1000 }}
                    />

                    <Pagination
                        links={transactions.links}
                        align="end"
                        meta={{
                            current_page: transactions.current_page,
                            per_page: transactions.per_page,
                            total: transactions.total,
                        }}
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
