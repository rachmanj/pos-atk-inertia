import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Select,
    Space,
    Spin,
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
    const [detailCache, setDetailCache] = useState({});
    const [loadingDetails, setLoadingDetails] = useState({});
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);

    useEffect(() => {
        setDetailCache({});
        setLoadingDetails({});
        setExpandedRowKeys([]);
    }, [
        filters.start_date,
        filters.end_date,
        filters.category_id,
        filters.cashier_id,
    ]);

    const fetchProductDetail = useCallback(
        async (productId) => {
            if (detailCache[productId] || loadingDetails[productId]) {
                return;
            }

            setLoadingDetails((prev) => ({ ...prev, [productId]: true }));

            try {
                const { data } = await axios.get(
                    `/account/reports/product-sales/${productId}/detail`,
                    {
                        params: {
                            start_date: filters.start_date,
                            end_date: filters.end_date,
                            category_id: filters.category_id || "",
                            cashier_id: filters.cashier_id || "",
                        },
                    },
                );

                setDetailCache((prev) => ({ ...prev, [productId]: data }));
            } finally {
                setLoadingDetails((prev) => ({ ...prev, [productId]: false }));
            }
        },
        [
            detailCache,
            loadingDetails,
            filters.start_date,
            filters.end_date,
            filters.category_id,
            filters.cashier_id,
        ],
    );

    const handleExpand = (expanded, record) => {
        if (expanded) {
            fetchProductDetail(record.product_id);
            setExpandedRowKeys((prev) => [...prev, record.product_id]);
        } else {
            setExpandedRowKeys((prev) =>
                prev.filter((key) => key !== record.product_id),
            );
        }
    };

    const detailColumns = [
        { title: "Waktu", dataIndex: "tanggal", width: 140 },
        {
            title: "No. Invoice",
            dataIndex: "invoice",
            render: (invoice) => (
                <Link href={`/account/transactions/${invoice}`}>
                    {invoice}
                </Link>
            ),
        },
        { title: "Kasir", dataIndex: "kasir" },
        {
            title: "Qty",
            dataIndex: "qty",
            align: "center",
            width: 70,
        },
        {
            title: "Harga Satuan",
            dataIndex: "harga_satuan",
            align: "right",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Subtotal",
            dataIndex: "subtotal",
            align: "right",
            render: (value) => formatRupiah(value),
        },
    ];

    const renderExpandedRow = (record) => {
        const productId = record.product_id;
        const isLoading = loadingDetails[productId];
        const detail = detailCache[productId];

        if (isLoading) {
            return (
                <div style={{ padding: 16, textAlign: "center" }}>
                    <Spin />
                </div>
            );
        }

        if (!detail || detail.items.length === 0) {
            return (
                <Text type="secondary" style={{ padding: 8, display: "block" }}>
                    Belum ada transaksi pada periode ini.
                </Text>
            );
        }

        return (
            <div style={{ padding: "8px 0" }}>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                    {detail.jumlah_transaksi} transaksi · Total {detail.total_qty}{" "}
                    pcs · {formatRupiah(detail.total_omzet)}
                </Text>
                <Table
                    rowKey={(row) => `${row.invoice}-${row.tanggal}`}
                    columns={detailColumns}
                    dataSource={detail.items}
                    size="small"
                    pagination={false}
                    scroll={{ x: "max-content" }}
                />
            </div>
        );
    };

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
                <Text style={{ color: "var(--semantic-success)" }}>
                    {formatRupiah(item.total_omzet)}
                </Text>
            ),
        },
        {
            title: "HPP",
            align: "right",
            render: (_, item) => (
                <Text style={{ color: "var(--semantic-warning)" }}>
                    {formatRupiah(item.total_cogs)}
                </Text>
            ),
        },
        {
            title: "Laba",
            align: "right",
            render: (_, item) => (
                <Text strong style={{ color: "var(--semantic-info)" }}>
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
                                    valueStyle={{ color: "var(--semantic-success)", fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Laba Kotor"
                                    value={formatRupiah(summary.total_laba)}
                                    valueStyle={{ color: "var(--semantic-info)", fontSize: 18 }}
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
                                    valueStyle={{ color: "var(--semantic-warning)", fontSize: 18 }}
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
                        expandable={{
                            expandedRowKeys,
                            onExpand: handleExpand,
                            expandedRowRender: renderExpandedRow,
                        }}
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
