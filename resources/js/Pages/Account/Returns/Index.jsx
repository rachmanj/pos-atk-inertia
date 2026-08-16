import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
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
    FileTextOutlined,
    ReloadOutlined,
    UndoOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const statusLabels = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
};

const statusColors = {
    pending: "warning",
    approved: "success",
    rejected: "error",
};

export default function Index() {
    const { returns, filters = {}, flash = {}, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [status, setStatus] = useState(filters.status || undefined);

    const handleFilter = (e) => {
        e.preventDefault();

        router.get(
            "/account/returns",
            { q: search, status: status || "" },
            { preserveState: true, replace: true },
        );
    };

    const handleReset = () => {
        setSearch("");
        setStatus(undefined);
        router.get("/account/returns");
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (returns.current_page - 1) * returns.per_page,
        },
        {
            title: "Invoice Retur",
            dataIndex: "invoice",
            render: (value) => <strong className="text-primary">{value}</strong>,
        },
        {
            title: "Invoice Transaksi",
            render: (_, record) => record.transaction?.invoice || "-",
        },
        {
            title: "Tanggal",
            dataIndex: "created_at",
            render: (value) =>
                new Date(value).toLocaleDateString("id-ID"),
        },
        {
            title: "Kasir",
            render: (_, record) => record.cashier?.name || "-",
        },
        {
            title: "Status",
            align: "center",
            dataIndex: "status",
            render: (value) => (
                <Tag color={statusColors[value] || "default"}>
                    {statusLabels[value] || value || "-"}
                </Tag>
            ),
        },
        {
            title: "Qty",
            align: "center",
            dataIndex: "total_qty",
            render: (value) => <strong>{value || 0}</strong>,
        },
        {
            title: "Refund",
            align: "right",
            dataIndex: "total_refund",
            render: (value) => (
                <strong className="text-success">{formatRupiah(value)}</strong>
            ),
        },
        {
            title: "Aksi",
            width: 100,
            align: "center",
            render: (_, record) =>
                hasAnyPermission(["returns.show"], permissions) ? (
                    <Link href={`/account/returns/${record.invoice}`}>
                        <Button size="small" icon={<EyeOutlined />}>
                            Detail
                        </Button>
                    </Link>
                ) : null,
        },
    ];

    return (
        <>
            <Head title="Retur Penjualan" />

            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    title={
                        <Title level={5} className="mb-0">
                            <UndoOutlined className="me-2" />
                            RETUR PENJUALAN
                        </Title>
                    }
                    extra={
                        hasAnyPermission(
                            ["transactions.index"],
                            permissions,
                        ) && (
                            <Link href="/account/transactions">
                                <Button icon={<FileTextOutlined />}>
                                    LIHAT TRANSAKSI
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
                            <Col xs={24} lg={12}>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari invoice retur, invoice transaksi, atau kasir..."
                                />
                            </Col>
                            <Col xs={24} lg={6}>
                                <Select
                                    allowClear
                                    placeholder="Semua Status"
                                    className="w-100"
                                    value={status}
                                    onChange={setStatus}
                                    options={[
                                        {
                                            value: "pending",
                                            label: "Menunggu",
                                        },
                                        {
                                            value: "approved",
                                            label: "Disetujui",
                                        },
                                        {
                                            value: "rejected",
                                            label: "Ditolak",
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
                        dataSource={returns.data}
                        pagination={false}
                        locale={{
                            emptyText:
                                "Belum ada retur penjualan. Retur dibuat dari detail transaksi yang sudah lunas.",
                        }}
                        scroll={{ x: 900 }}
                    />

                    <Pagination
                        links={returns.links}
                        align="end"
                        meta={{
                            current_page: returns.current_page,
                            per_page: returns.per_page,
                            total: returns.total,
                        }}
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
