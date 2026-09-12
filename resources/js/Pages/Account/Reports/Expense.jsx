import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
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
    CalendarOutlined,
    FileExcelOutlined,
    FilterOutlined,
    FileTextOutlined,
    ReloadOutlined,
    TagsOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const EXPENSE_CATEGORY_LABELS = {
    operational: "Operasional",
    salary: "Gaji / Komisi",
    rent: "Sewa",
    utilities: "Listrik, Air, Internet",
    transport: "Transportasi",
    maintenance: "Perawatan",
    promotion: "Promosi",
    other: "Lainnya",
};

const categoryLabel = (value) =>
    EXPENSE_CATEGORY_LABELS[value] || value || "-";

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
        dateStyle: "medium",
    });
};

export default function ExpenseReport() {
    const {
        expenses,
        byCategory = [],
        byMonth = [],
        summary,
        filters = {},
        categoryList = [],
        cashiers = [],
        isAdmin = false,
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [search, setSearch] = useState(filters.q || "");
    const [dateRange, setDateRange] = useState([
        dayjs(filters.start_date),
        dayjs(filters.end_date),
    ]);
    const [category, setCategory] = useState(filters.category || undefined);
    const [cashierId, setCashierId] = useState(
        filters.cashier_id || undefined,
    );

    const startDate = dateRange?.[0]?.format("YYYY-MM-DD") || "";
    const endDate = dateRange?.[1]?.format("YYYY-MM-DD") || "";

    const chartByCategory = useMemo(
        () =>
            byCategory.map((item) => ({
                ...item,
                category_label: categoryLabel(item.category),
            })),
        [byCategory],
    );

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/expense", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            category: category || "",
            cashier_id: cashierId || "",
        });
    };

    const handleReset = () => {
        const defaultRange = [dayjs().startOf("month"), dayjs()];
        setSearch("");
        setDateRange(defaultRange);
        setCategory(undefined);
        setCashierId(undefined);
        router.get("/account/reports/expense", {
            start_date: defaultRange[0].format("YYYY-MM-DD"),
            end_date: defaultRange[1].format("YYYY-MM-DD"),
        });
    };

    const handleDatePreset = (start, end) => {
        setDateRange([dayjs(start), dayjs(end)]);
        router.get("/account/reports/expense", {
            q: search,
            start_date: start,
            end_date: end,
            category: category || "",
            cashier_id: cashierId || "",
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            q: search,
            start_date: startDate,
            end_date: endDate,
            category: category || "",
            cashier_id: cashierId || "",
        });
        window.location.href = `/account/reports/expense/export?${params.toString()}`;
    };

    const formatChartRupiah = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value;
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (expenses.current_page - 1) * expenses.per_page,
        },
        {
            title: "Kode",
            render: (_, row) => (
                <Text style={{ color: "var(--semantic-info)" }}>
                    {row.expense?.code ?? "-"}
                </Text>
            ),
        },
        {
            title: "Tanggal",
            render: (_, row) => formatDate(row.expense?.expense_date),
        },
        {
            title: "Kategori",
            dataIndex: "category",
            render: (cat) => <Tag>{categoryLabel(cat)}</Tag>,
        },
        {
            title: "Judul",
            dataIndex: "title",
            render: (title) => <Text strong>{title}</Text>,
        },
        {
            title: "Staff",
            render: (_, row) => row.expense?.user?.name ?? "-",
        },
        {
            title: "Jumlah",
            align: "right",
            dataIndex: "amount",
            render: (value) => (
                <Text strong type="danger">
                    {formatRupiah(value)}
                </Text>
            ),
        },
    ];

    return (
        <>
            <Head title="Laporan Pengeluaran" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <FileTextOutlined style={{ marginRight: 8 }} />
                            LAPORAN PENGELUARAN
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
                                    placeholder="Cari pengeluaran..."
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} lg={8}>
                                <RangePicker
                                    style={{ width: "100%" }}
                                    format="DD/MM/YYYY"
                                    allowClear={false}
                                    value={dateRange}
                                    onChange={(value) => setDateRange(value)}
                                />
                            </Col>
                            <Col xs={24} lg={4}>
                                <Select
                                    style={{ width: "100%" }}
                                    placeholder="Semua Kategori"
                                    allowClear
                                    value={category}
                                    onChange={setCategory}
                                    options={categoryList.map((cat) => ({
                                        value: cat,
                                        label: categoryLabel(cat),
                                    }))}
                                />
                            </Col>
                            {isAdmin && (
                                <Col xs={24} lg={4}>
                                    <Select
                                        style={{ width: "100%" }}
                                        placeholder="Semua Staff"
                                        allowClear
                                        value={cashierId}
                                        onChange={setCashierId}
                                        options={cashiers.map((c) => ({
                                            value: String(c.id),
                                            label: c.name,
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
                        <Col xs={12} sm={6} md={8}>
                            <Card size="small">
                                <Statistic
                                    title="Total Pengeluaran"
                                    value={formatRupiah(summary.total_amount)}
                                    valueStyle={{
                                        color: "var(--semantic-error)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={8}>
                            <Card size="small">
                                <Statistic
                                    title="Jumlah Baris"
                                    value={summary.total_count}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={8}>
                            <Card size="small">
                                <Statistic
                                    title="Rata-rata per Baris"
                                    value={formatRupiah(
                                        summary.avg_per_transaction,
                                    )}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} md={12}>
                            <Card
                                size="small"
                                title={
                                    <Space>
                                        <TagsOutlined />
                                        Pengeluaran per Kategori
                                    </Space>
                                }
                            >
                                {chartByCategory.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={280}
                                    >
                                        <BarChart
                                            data={chartByCategory}
                                            layout="vertical"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                type="number"
                                                tickFormatter={formatChartRupiah}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="category_label"
                                                width={120}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                formatter={(value) => [
                                                    formatRupiah(value),
                                                    "Total",
                                                ]}
                                            />
                                            <Bar
                                                dataKey="total_amount"
                                                fill={"var(--semantic-error)"}
                                                name="Total"
                                                radius={[0, 4, 4, 0]}
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
                        <Col xs={24} md={12}>
                            <Card
                                size="small"
                                title={
                                    <Space>
                                        <CalendarOutlined />
                                        Tren Bulanan
                                    </Space>
                                }
                            >
                                {byMonth.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={280}
                                    >
                                        <BarChart data={byMonth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="month"
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
                                            <Bar
                                                dataKey="total_amount"
                                                fill={"var(--semantic-warning)"}
                                                name="Total"
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

                    <Title level={5} style={{ marginBottom: 12 }}>
                        <UnorderedListOutlined style={{ marginRight: 8 }} />
                        Detail Pengeluaran
                    </Title>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={expenses.data}
                        pagination={false}
                        scroll={{ x: "max-content" }}
                        locale={{
                            emptyText:
                                "Belum ada data pengeluaran untuk filter ini.",
                        }}
                    />

                    <Pagination
                        links={expenses.links}
                        meta={expenses}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
