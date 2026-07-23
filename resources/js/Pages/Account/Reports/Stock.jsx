import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Button,
    Card,
    Col,
    Input,
    InputNumber,
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
    HistoryOutlined,
    InboxOutlined,
    ReloadOutlined,
    SlidersOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const movementTypeLabels = {
    in: "Masuk",
    out: "Keluar",
    adjustment: "Penyesuaian",
};

const getStockTag = (stock, threshold) => {
    if (stock <= 0) return { label: "Habis", color: "error" };
    if (stock <= threshold) return { label: "Menipis", color: "warning" };
    return { label: "Aman", color: "success" };
};

export default function StockReport() {
    const {
        products,
        summary,
        filters = {},
        categories = [],
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [categoryId, setCategoryId] = useState(
        filters.category_id || undefined,
    );
    const [stockStatus, setStockStatus] = useState(
        filters.stock_status || undefined,
    );
    const [lowThreshold, setLowThreshold] = useState(
        filters.low_threshold || 10,
    );
    const [deadStockDays, setDeadStockDays] = useState(
        filters.dead_stock_days || 90,
    );

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/stock", {
            q: search,
            category_id: categoryId || "",
            stock_status: stockStatus || "",
            low_threshold: lowThreshold,
            dead_stock_days: deadStockDays,
        });
    };

    const handleReset = () => {
        setSearch("");
        setCategoryId(undefined);
        setStockStatus(undefined);
        setLowThreshold(10);
        setDeadStockDays(90);
        router.get("/account/reports/stock");
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            q: search,
            category_id: categoryId || "",
            stock_status: stockStatus || "",
            low_threshold: lowThreshold,
            dead_stock_days: deadStockDays,
        });
        window.location.href = `/account/reports/stock/export?${params.toString()}`;
    };

    const formatDate = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (products.current_page - 1) * products.per_page,
        },
        {
            title: "Produk",
            render: (_, product) => (
                <>
                    <Text strong style={{ color: "#1677ff" }}>
                        {product.title}
                    </Text>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {product.barcode || "-"}
                        </Text>
                    </div>
                </>
            ),
        },
        {
            title: "Kategori",
            render: (_, product) => product.category?.name || "-",
        },
        {
            title: "Stok",
            align: "center",
            render: (_, product) => (
                <Text strong>
                    {product.stock}{" "}
                    <Text type="secondary">{product.unit || "pcs"}</Text>
                </Text>
            ),
        },
        {
            title: "HPP (WAC)",
            align: "right",
            render: (_, product) => formatRupiah(product.avg_cost),
        },
        {
            title: "Harga Jual (base)",
            align: "right",
            render: (_, product) => formatRupiah(product.sell_price),
        },
        {
            title: "Nilai Modal",
            align: "right",
            render: (_, product) => (
                <Text strong style={{ color: "#52c41a" }}>
                    {formatRupiah(product.inventory_cost_value)}
                </Text>
            ),
        },
        {
            title: "Status",
            align: "center",
            render: (_, product) => {
                const badge = getStockTag(
                    product.stock,
                    Number(filters.low_threshold),
                );
                return (
                    <Space wrap size={4}>
                        {product.is_dead_stock && (
                            <Tag color="default">Dead</Tag>
                        )}
                        {product.needs_reorder && (
                            <Tag color="warning">Reorder</Tag>
                        )}
                        <Tag color={badge.color}>{badge.label}</Tag>
                    </Space>
                );
            },
        },
        {
            title: "Terakhir Keluar",
            align: "center",
            render: (_, product) => {
                if (product.days_since_last_out === null) {
                    return product.stock > 0 ? (
                        <Tag color="default">Belum pernah</Tag>
                    ) : (
                        "-"
                    );
                }
                return (
                    <Tag
                        color={
                            product.is_dead_stock
                                ? "default"
                                : product.days_since_last_out > 30
                                  ? "warning"
                                  : "success"
                        }
                    >
                        {product.days_since_last_out} hari
                    </Tag>
                );
            },
        },
        {
            title: "Pergerakan Terakhir",
            render: (_, product) =>
                product.latest_movement ? (
                    <>
                        <Text strong>
                            {product.latest_movement.source_label}
                            {product.latest_movement.type
                                ? ` / ${
                                      movementTypeLabels[
                                          product.latest_movement.type
                                      ] || product.latest_movement.type
                                  }`
                                : ""}
                        </Text>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {formatDate(
                                    product.latest_movement.created_at,
                                )}
                            </Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {product.latest_movement.user?.name || "-"}
                            </Text>
                        </div>
                    </>
                ) : (
                    <Text type="secondary">Belum ada</Text>
                ),
        },
        {
            title: "Aksi",
            width: 180,
            align: "center",
            render: (_, product) => {
                const canViewMovement = hasAnyPermission(
                    ["stock_movements.index"],
                    permissions,
                );
                const canAdjustStock = hasAnyPermission(
                    ["stock_movements.create"],
                    permissions,
                );

                if (!canViewMovement && !canAdjustStock) return "-";

                return (
                    <Space>
                        {canViewMovement && (
                            <Link
                                href={`/account/stock-movements?q=${encodeURIComponent(product.barcode || product.title)}`}
                            >
                                <Button
                                    size="small"
                                    icon={<HistoryOutlined />}
                                >
                                    Riwayat
                                </Button>
                            </Link>
                        )}
                        {canAdjustStock && (
                            <Link
                                href={`/account/stock-movements/create?product_id=${product.id}`}
                            >
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<SlidersOutlined />}
                                >
                                    Sesuaikan
                                </Button>
                            </Link>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Laporan Stok" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <InboxOutlined style={{ marginRight: 8 }} />
                            LAPORAN STOK
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
                                    placeholder="Cari produk, barcode, atau kategori..."
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} lg={4}>
                                <Select
                                    style={{ width: "100%" }}
                                    placeholder="Semua Kategori"
                                    allowClear
                                    value={categoryId}
                                    onChange={setCategoryId}
                                    options={categories.map((category) => ({
                                        value: String(category.id),
                                        label: category.name,
                                    }))}
                                />
                            </Col>
                            <Col xs={24} lg={4}>
                                <Select
                                    style={{ width: "100%" }}
                                    placeholder="Semua Status"
                                    allowClear
                                    value={stockStatus}
                                    onChange={setStockStatus}
                                    options={[
                                        { value: "available", label: "Aman" },
                                        { value: "low", label: "Menipis" },
                                        { value: "out", label: "Habis" },
                                        {
                                            value: "dead_stock",
                                            label: "Dead Stock",
                                        },
                                    ]}
                                />
                            </Col>
                            <Col xs={12} lg={3}>
                                <InputNumber
                                    min={1}
                                    style={{ width: "100%" }}
                                    value={lowThreshold}
                                    onChange={setLowThreshold}
                                    placeholder="Ambang menipis"
                                />
                            </Col>
                            <Col xs={12} lg={3}>
                                <InputNumber
                                    min={1}
                                    style={{ width: "100%" }}
                                    value={deadStockDays}
                                    onChange={setDeadStockDays}
                                    placeholder="Hari dead stock"
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
                            <Col span={24}>
                                <DatePreset
                                    onApply={(start, end) => {
                                        router.get("/account/reports/stock", {
                                            q: search,
                                            category_id: categoryId || "",
                                            stock_status: stockStatus || "",
                                            low_threshold: lowThreshold,
                                            dead_stock_days: deadStockDays,
                                            start_date: start,
                                            end_date: end,
                                        });
                                    }}
                                />
                            </Col>
                        </Row>
                    </form>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card size="small">
                                <Statistic
                                    title="Total Produk"
                                    value={summary.total_products}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Aktif: {summary.active_products}
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card size="small">
                                <Statistic
                                    title="Total Unit Stok"
                                    value={summary.total_stock_qty}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Habis: {summary.out_of_stock_products}
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card size="small">
                                <Statistic
                                    title="Nilai Modal"
                                    value={formatRupiah(
                                        summary.inventory_cost_value,
                                    )}
                                    valueStyle={{
                                        color: "#52c41a",
                                        fontSize: 16,
                                    }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Nilai jual:{" "}
                                    {formatRupiah(summary.inventory_sell_value)}
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Link href="/account/reports/stock?stock_status=out">
                                <Card size="small" hoverable>
                                    <Statistic
                                        title="Stok Habis"
                                        value={summary.out_of_stock_products}
                                        valueStyle={{
                                            color: "#ff4d4f",
                                            fontSize: 18,
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Klik untuk filter
                                    </Text>
                                </Card>
                            </Link>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Link
                                href={`/account/reports/stock?stock_status=low&low_threshold=${filters.low_threshold}`}
                            >
                                <Card size="small" hoverable>
                                    <Statistic
                                        title="Produk Menipis"
                                        value={summary.low_stock_products}
                                        valueStyle={{
                                            color: "#faad14",
                                            fontSize: 18,
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Ambang: {filters.low_threshold}
                                    </Text>
                                </Card>
                            </Link>
                        </Col>
                    </Row>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={products.data}
                        pagination={false}
                        scroll={{ x: 1200 }}
                        locale={{
                            emptyText:
                                "Belum ada data stok untuk filter ini.",
                        }}
                    />

                    <Pagination
                        links={products.links}
                        meta={products}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
