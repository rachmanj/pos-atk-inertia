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
    EyeOutlined,
    FileExcelOutlined,
    FilterOutlined,
    LineChartOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const { Title, Text } = Typography;

const paymentMethodLabels = {
    cash: "Tunai",
    digital: "Digital",
    qris: "QRIS",
    transfer: "Transfer",
};

const paymentMethodColors = {
    cash: "success",
    digital: "blue",
    qris: "cyan",
    transfer: "warning",
};

export default function SalesReport() {
    const {
        sales,
        salesByDay = [],
        salesByHour = [],
        summary,
        filters = {},
        cashiers = [],
        isAdmin = false,
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [paymentMethod, setPaymentMethod] = useState(
        filters.payment_method || undefined,
    );
    const [cashierId, setCashierId] = useState(
        filters.cashier_id || undefined,
    );

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/sales", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            payment_method: paymentMethod || "",
            cashier_id: cashierId || "",
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate(filters.start_date || "");
        setEndDate(filters.end_date || "");
        setPaymentMethod(undefined);
        setCashierId(undefined);
        router.get("/account/reports/sales");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/sales", {
            q: search,
            start_date: start,
            end_date: end,
            payment_method: paymentMethod || "",
            cashier_id: cashierId || "",
        });
    };

    const handleExport = () => {
        window.location.href = `/account/reports/sales/export?start_date=${startDate}&end_date=${endDate}&payment_method=${paymentMethod || ""}&cashier_id=${cashierId || ""}`;
    };

    const formatChartRupiah = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value;
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
                index + 1 + (sales.current_page - 1) * sales.per_page,
        },
        {
            title: "Invoice",
            dataIndex: "invoice",
            render: (invoice) => <Text strong style={{ color: "#1677ff" }}>{invoice}</Text>,
        },
        {
            title: "Tanggal Lunas",
            render: (_, sale) =>
                formatDate(sale.paid_at || sale.created_at),
        },
        {
            title: "Kasir",
            render: (_, sale) => sale.cashier?.name || "-",
        },
        {
            title: "Customer",
            render: (_, sale) => sale.customer?.name || "Umum",
        },
        {
            title: "Metode",
            align: "center",
            render: (_, sale) => (
                <Tag color={paymentMethodColors[sale.payment_method] || "default"}>
                    {paymentMethodLabels[sale.payment_method] ||
                        sale.payment_method ||
                        "-"}
                </Tag>
            ),
        },
        {
            title: "Item",
            align: "center",
            render: (_, sale) => (
                <Text strong>{Number(sale.total_items || 0)}</Text>
            ),
        },
        {
            title: "Diskon",
            align: "right",
            render: (_, sale) => (
                <Text type="danger">{formatRupiah(sale.discount)}</Text>
            ),
        },
        {
            title: "Total",
            align: "right",
            render: (_, sale) => (
                <Text strong style={{ color: "#52c41a" }}>
                    {formatRupiah(sale.grand_total)}
                </Text>
            ),
        },
        {
            title: "Aksi",
            width: 100,
            align: "center",
            render: (_, sale) =>
                hasAnyPermission(["transactions.show"], permissions) ? (
                    <Link href={`/account/transactions/${sale.invoice}`}>
                        <Button size="small" icon={<EyeOutlined />}>
                            Detail
                        </Button>
                    </Link>
                ) : (
                    "-"
                ),
        },
    ];

    return (
        <>
            <Head title="Laporan Penjualan" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <LineChartOutlined style={{ marginRight: 8 }} />
                            LAPORAN PENJUALAN
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
                                    placeholder="Cari invoice, customer, atau kasir..."
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
                                    placeholder="Semua Metode"
                                    allowClear
                                    value={paymentMethod}
                                    onChange={setPaymentMethod}
                                    options={[
                                        { value: "cash", label: "Tunai" },
                                        { value: "digital", label: "Digital" },
                                        { value: "qris", label: "QRIS" },
                                        { value: "transfer", label: "Transfer" },
                                    ]}
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
                            <Link
                                href={`/account/reports/sales?start_date=${startDate}&end_date=${endDate}&cashier_id=${cashierId || ""}`}
                            >
                                <Card size="small" hoverable>
                                    <Statistic
                                        title="Penjualan Bersih"
                                        value={formatRupiah(summary.net_sales)}
                                        valueStyle={{
                                            color: "#52c41a",
                                            fontSize: 18,
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Retur: {formatRupiah(summary.total_returns)}
                                    </Text>
                                </Card>
                            </Link>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Penjualan Kotor"
                                    value={formatRupiah(summary.total_sales)}
                                    valueStyle={{ color: "#1677ff", fontSize: 18 }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Diskon: {formatRupiah(summary.total_discount)} ·
                                    Tx: {summary.total_transactions}
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Link
                                href={`/account/reports/sales?start_date=${startDate}&end_date=${endDate}&payment_method=cash&cashier_id=${cashierId || ""}`}
                            >
                                <Card size="small" hoverable>
                                    <Statistic
                                        title="Tunai Bersih"
                                        value={formatRupiah(summary.cash_sales)}
                                        valueStyle={{
                                            color: "#52c41a",
                                            fontSize: 18,
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Digital:{" "}
                                        {formatRupiah(summary.digital_sales)}
                                    </Text>
                                </Card>
                            </Link>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Link
                                href={`/account/reports/sales?start_date=${startDate}&end_date=${endDate}&payment_method=qris&cashier_id=${cashierId || ""}`}
                            >
                                <Card size="small" hoverable>
                                    <Statistic
                                        title="QRIS Bersih"
                                        value={formatRupiah(summary.qris_sales || 0)}
                                        valueStyle={{ color: "#13c2c2", fontSize: 18 }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Transfer:{" "}
                                        {formatRupiah(summary.transfer_sales || 0)}
                                    </Text>
                                </Card>
                            </Link>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} lg={16}>
                            <Card
                                size="small"
                                title="Tren Penjualan Harian"
                            >
                                {salesByDay.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={salesByDay}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis
                                                tickFormatter={formatChartRupiah}
                                            />
                                            <Tooltip
                                                formatter={(value) => [
                                                    formatRupiah(value),
                                                    "Total",
                                                ]}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#1677ff"
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                name="Omzet (Rp)"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Text
                                        type="secondary"
                                        style={{
                                            display: "block",
                                            textAlign: "center",
                                            padding: 32,
                                        }}
                                    >
                                        Belum ada data.
                                    </Text>
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card size="small" title="Penjualan per Jam">
                                {salesByHour.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={salesByHour}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="hour"
                                                tick={{ fontSize: 11 }}
                                            />
                                            <YAxis
                                                tickFormatter={formatChartRupiah}
                                            />
                                            <Tooltip
                                                formatter={(value) => [
                                                    formatRupiah(value),
                                                    "Total",
                                                ]}
                                                labelFormatter={(label) =>
                                                    `Jam ${label}:00`
                                                }
                                            />
                                            <Bar
                                                dataKey="total"
                                                fill="#52c41a"
                                                name="Omzet (Rp)"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Text
                                        type="secondary"
                                        style={{
                                            display: "block",
                                            textAlign: "center",
                                            padding: 32,
                                        }}
                                    >
                                        Belum ada data.
                                    </Text>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={sales.data}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        locale={{
                            emptyText:
                                "Belum ada data penjualan untuk filter ini.",
                        }}
                    />

                    <Pagination links={sales.links} meta={sales} align="end" />
                </Card>
            </LayoutAccount>
        </>
    );
}
