import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Select,
    Space,
    Table,
    Typography,
} from "antd";
import {
    EyeOutlined,
    FilterOutlined,
    PlusOutlined,
    ReloadOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;

export default function PurchaseIndex() {
    const {
        purchases,
        suppliers = [],
        filters = {},
        flash = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [supplierId, setSupplierId] = useState(
        filters.supplier_id || undefined,
    );
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/purchases", {
            q: search,
            supplier_id: supplierId || "",
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleReset = () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const formatDate = (date) =>
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        setSearch("");
        setSupplierId(undefined);
        setStartDate(formatDate(monthStart));
        setEndDate(formatDate(now));
        router.get("/account/purchases");
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (purchases.current_page - 1) * purchases.per_page,
        },
        {
            title: "Invoice",
            dataIndex: "invoice",
            render: (value) => <strong className="text-primary">{value}</strong>,
        },
        {
            title: "Tanggal",
            dataIndex: "purchase_date",
            render: (value) =>
                new Date(value).toLocaleDateString("id-ID"),
        },
        {
            title: "Supplier",
            render: (_, record) => record.supplier?.name || "-",
        },
        {
            title: "Pembuat",
            render: (_, record) => record.user?.name || "-",
        },
        {
            title: "Item",
            align: "center",
            dataIndex: "total_items",
            render: (value) => <strong>{value}</strong>,
        },
        {
            title: "Qty",
            align: "center",
            dataIndex: "total_qty",
            render: (value) => <strong>{value}</strong>,
        },
        {
            title: "Total",
            align: "right",
            dataIndex: "total_amount",
            render: (value) => (
                <strong className="text-success">{formatRupiah(value)}</strong>
            ),
        },
        {
            title: "Aksi",
            width: 100,
            align: "center",
            render: (_, record) =>
                hasAnyPermission(["purchases.show"], permissions) ? (
                    <Link href={`/account/purchases/${record.invoice}`}>
                        <Button size="small" icon={<EyeOutlined />}>
                            Detail
                        </Button>
                    </Link>
                ) : null,
        },
    ];

    return (
        <>
            <Head>
                <title>Pembelian - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    title={
                        <Title level={5} className="mb-0">
                            <ShoppingOutlined className="me-2" />
                            PEMBELIAN
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["purchases.create"], permissions) && (
                            <Link href="/account/purchases/create">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                >
                                    TAMBAH PEMBELIAN
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
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari invoice, supplier, atau pembuat..."
                                />
                            </Col>
                            <Col xs={24} sm={8} lg={4}>
                                <Select
                                    allowClear
                                    placeholder="Semua Supplier"
                                    className="w-100"
                                    value={supplierId}
                                    onChange={setSupplierId}
                                    options={suppliers.map((supplier) => ({
                                        value: String(supplier.id),
                                        label: supplier.name,
                                    }))}
                                />
                            </Col>
                            <Col xs={24} sm={8} lg={4}>
                                <DatePicker
                                    className="w-100"
                                    placeholder="Dari tanggal"
                                    format="YYYY-MM-DD"
                                    value={startDate ? dayjs(startDate) : null}
                                    onChange={(_, dateString) =>
                                        setStartDate(dateString)
                                    }
                                />
                            </Col>
                            <Col xs={24} sm={8} lg={4}>
                                <DatePicker
                                    className="w-100"
                                    placeholder="Sampai tanggal"
                                    format="YYYY-MM-DD"
                                    value={endDate ? dayjs(endDate) : null}
                                    onChange={(_, dateString) =>
                                        setEndDate(dateString)
                                    }
                                />
                            </Col>
                            <Col xs={24} lg={4}>
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
                        dataSource={purchases.data}
                        pagination={false}
                        locale={{
                            emptyText:
                                "Belum ada data pembelian. Buat pembelian pertama dari menu Pembelian Supplier.",
                        }}
                        scroll={{ x: 900 }}
                    />

                    <Pagination
                        links={purchases.links}
                        align="end"
                        meta={{
                            current_page: purchases.current_page,
                            per_page: purchases.per_page,
                            total: purchases.total,
                        }}
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
