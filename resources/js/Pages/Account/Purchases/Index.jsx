import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, SEMANTIC } from "../../../theme/colors";
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
    Spin,
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

const { Title, Text } = Typography;

export default function PurchaseIndex() {
    const {
        purchases,
        suppliers = [],
        filters = {},
        flash = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();

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
            render: (value) => (
                <Text strong style={{ color: BRAND.primary }}>
                    {value}
                </Text>
            ),
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
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Qty",
            align: "center",
            dataIndex: "total_qty",
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Total",
            align: "right",
            dataIndex: "total_amount",
            render: (value) => (
                <Text strong style={{ color: SEMANTIC.success }}>
                    {formatRupiah(value)}
                </Text>
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
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <ShoppingOutlined
                                    style={{ color: BRAND.primary }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    PEMBELIAN
                                </Title>
                            </Space>
                        }
                        extra={
                            hasAnyPermission(
                                ["purchases.create"],
                                permissions,
                            ) && (
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
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari invoice, supplier, atau pembuat..."
                                    />
                                </Col>
                                <Col xs={24} sm={8} lg={4}>
                                    <Select
                                        allowClear
                                        placeholder="Semua Supplier"
                                        style={{ width: "100%" }}
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
                                        style={{ width: "100%" }}
                                        placeholder="Dari tanggal"
                                        format="YYYY-MM-DD"
                                        value={
                                            startDate
                                                ? dayjs(startDate)
                                                : null
                                        }
                                        onChange={(_, dateString) =>
                                            setStartDate(dateString)
                                        }
                                    />
                                </Col>
                                <Col xs={24} sm={8} lg={4}>
                                    <DatePicker
                                        style={{ width: "100%" }}
                                        placeholder="Sampai tanggal"
                                        format="YYYY-MM-DD"
                                        value={
                                            endDate ? dayjs(endDate) : null
                                        }
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
                            rowKey="id"
                            columns={columns}
                            dataSource={purchases.data}
                            pagination={false}
                            scroll={{ x: "max-content" }}
                            locale={{
                                emptyText:
                                    "Belum ada data pembelian. Buat pembelian pertama dari menu Tambah Pembelian.",
                            }}
                        />

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={purchases.links}
                                align="end"
                                meta={{
                                    current_page: purchases.current_page,
                                    per_page: purchases.per_page,
                                    total: purchases.total,
                                }}
                            />
                        </div>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
