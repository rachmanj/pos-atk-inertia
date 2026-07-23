import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    FileExcelOutlined,
    FilterOutlined,
    ReloadOutlined,
    StarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ProductSalesReport() {
    const {
        productSales,
        summary,
        filters = {},
        categories = [],
        cashiers = [],
        isAdmin = false,
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [categoryId, setCategoryId] = useState(
        filters.category_id || undefined,
    );
    const [cashierId, setCashierId] = useState(
        filters.cashier_id || undefined,
    );

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/product-sales", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            category_id: categoryId || "",
            cashier_id: cashierId || "",
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setCategoryId(undefined);
        setCashierId(undefined);
        router.get("/account/reports/product-sales");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/product-sales", {
            q: search,
            start_date: start,
            end_date: end,
            category_id: categoryId || "",
            cashier_id: cashierId || "",
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            q: search,
            start_date: startDate,
            end_date: endDate,
            category_id: categoryId || "",
            cashier_id: cashierId || "",
        });
        window.location.href = `/account/reports/product-sales/export?${params.toString()}`;
    };

    const marginColor = (margin) => {
        if (margin >= 20) return "success";
        if (margin >= 10) return "warning";
        return "error";
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (productSales.current_page - 1) * productSales.per_page,
        },
        {
            title: "Produk",
            render: (_, item) => (
                <Text strong>{item.product?.title ?? "-"}</Text>
            ),
        },
        {
            title: "Barcode",
            render: (_, item) => item.product?.barcode ?? "-",
        },
        {
            title: "Kategori",
            render: (_, item) => item.product?.category?.name ?? "-",
        },
        {
            title: "Qty Terjual",
            align: "center",
            render: (_, item) => <Text strong>{item.total_qty}</Text>,
        },
        {
            title: "Omzet",
            align: "right",
            render: (_, item) => (
                <Text style={{ color: "#52c41a" }}>
                    {formatRupiah(item.total_omzet)}
                </Text>
            ),
        },
        {
            title: "HPP",
            align: "right",
            render: (_, item) => (
                <Text style={{ color: "#faad14" }}>
                    {formatRupiah(item.total_cogs)}
                </Text>
            ),
        },
        {
            title: "Laba",
            align: "right",
            render: (_, item) => (
                <Text strong style={{ color: "#1677ff" }}>
                    {formatRupiah(item.total_laba)}
                </Text>
            ),
        },
        {
            title: "Margin",
            align: "center",
            render: (_, item) => (
                <Tag color={marginColor(item.margin)}>{item.margin}%</Tag>
            ),
        },
    ];

    return (
        <>
            <Head title="Produk Terlaris" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <StarOutlined style={{ marginRight: 8 }} />
                            PRODUK TERLARIS
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["reports.export"], permissions) && (
                            <Button
                                type="primary"
                                icon={<FileExcelOutlined />}
                                onClick={handleExport}
                            >
                                Export Excel
                            </Button>
                        )
                    }
                >
                    <form onSubmit={handleFilter}>
                        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                            <Col xs={24} lg={6}>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari produk (nama/barcode)..."
                                    allowClear
                                />
                            </Col>
                            <Col xs={12} lg={4}>
                                <DatePicker
                                    style={{ width: "100%" }}
                                    placeholder="Tanggal mulai"
                                    format="DD/MM/YYYY"
                                    value={startDate ? dayjs(startDate) : null}
                                    onChange={(date) =>
                                        setStartDate(
                                            date
                                                ? date.format("YYYY-MM-DD")
                                                : "",
                                        )
                                    }
                                />
                            </Col>
                            <Col xs={12} lg={4}>
                                <DatePicker
                                    style={{ width: "100%" }}
                                    placeholder="Tanggal akhir"
                                    format="DD/MM/YYYY"
                                    value={endDate ? dayjs(endDate) : null}
                                    onChange={(date) =>
                                        setEndDate(
                                            date
                                                ? date.format("YYYY-MM-DD")
                                                : "",
                                        )
                                    }
                                />
                            </Col>
                            <Col xs={24} lg={4}>
                                <Select
                                    style={{ width: "100%" }}
                                    placeholder="Semua Kategori"
                                    allowClear
                                    value={categoryId}
                                    onChange={setCategoryId}
                                    options={categories.map((cat) => ({
                                        value: String(cat.id),
                                        label: cat.name,
                                    }))}
                                />
                            </Col>
                            {isAdmin && (
                                <Col xs={24} lg={4}>
                                    <Select
                                        style={{ width: "100%" }}
                                        placeholder="Semua Kasir"
                                        allowClear
                                        value={cashierId}
                                        onChange={setCashierId}
                                        options={cashiers.map((cashier) => ({
                                            value: String(cashier.id),
                                            label: cashier.name,
                                        }))}
                                    />
                                </Col>
                            )}
                            <Col xs={24} lg={isAdmin ? 6 : 6}>
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
                            <Col span={24}>
                                <DatePreset onApply={handleDatePreset} />
                            </Col>
                        </Row>
                    </form>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Omzet"
                                    value={formatRupiah(summary.total_omzet)}
                                    valueStyle={{ color: "#52c41a", fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Laba Kotor"
                                    value={formatRupiah(summary.total_laba)}
                                    valueStyle={{ color: "#1677ff", fontSize: 18 }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Margin: {summary.margin}%
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total HPP"
                                    value={formatRupiah(summary.total_cogs)}
                                    valueStyle={{ color: "#faad14", fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Qty Terjual"
                                    value={summary.total_qty}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        rowKey="product_id"
                        columns={columns}
                        dataSource={productSales.data}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        locale={{
                            emptyText:
                                "Belum ada data penjualan produk untuk filter ini.",
                        }}
                    />

                    <Pagination
                        links={productSales.links}
                        meta={productSales}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
