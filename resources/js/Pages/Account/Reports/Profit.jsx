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
    Typography,
} from "antd";
import {
    DollarOutlined,
    EyeOutlined,
    FileExcelOutlined,
    FilterOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ProfitReport() {
    const {
        profits,
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
    const [cashierId, setCashierId] = useState(
        filters.cashier_id || undefined,
    );

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/profit", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId || "",
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate(filters.start_date || "");
        setEndDate(filters.end_date || "");
        setCashierId(undefined);
        router.get("/account/reports/profit");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/profit", {
            q: search,
            start_date: start,
            end_date: end,
            cashier_id: cashierId || "",
        });
    };

    const handleExport = () => {
        window.location.href = `/account/reports/profit/export?start_date=${startDate}&end_date=${endDate}&cashier_id=${cashierId || ""}`;
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
                index + 1 + (profits.current_page - 1) * profits.per_page,
        },
        {
            title: "Invoice",
            render: (_, profit) => (
                <Text strong style={{ color: "#1677ff" }}>
                    {profit.transaction?.invoice || "-"}
                </Text>
            ),
        },
        {
            title: "Tanggal",
            render: (_, profit) =>
                formatDate(
                    profit.transaction?.paid_at ||
                        profit.transaction?.created_at,
                ),
        },
        {
            title: "Kasir",
            render: (_, profit) => profit.transaction?.cashier?.name || "-",
        },
        {
            title: "Customer",
            render: (_, profit) =>
                profit.transaction?.customer?.name || "Umum",
        },
        {
            title: "Pendapatan",
            align: "right",
            render: (_, profit) => (
                <Text strong style={{ color: "#52c41a" }}>
                    {formatRupiah(profit.total_revenue)}
                </Text>
            ),
        },
        {
            title: "HPP",
            align: "right",
            render: (_, profit) => (
                <Text type="danger">{formatRupiah(profit.total_cost)}</Text>
            ),
        },
        {
            title: "Laba",
            align: "right",
            render: (_, profit) => (
                <Text
                    strong
                    style={{
                        color:
                            profit.profit_amount >= 0 ? "#1677ff" : "#ff4d4f",
                    }}
                >
                    {formatRupiah(profit.profit_amount)}
                </Text>
            ),
        },
        {
            title: "Aksi",
            width: 100,
            align: "center",
            render: (_, profit) => {
                const transaction = profit.transaction;
                return hasAnyPermission(["transactions.show"], permissions) &&
                    transaction ? (
                    <Link href={`/account/transactions/${transaction.invoice}`}>
                        <Button size="small" icon={<EyeOutlined />}>
                            Detail
                        </Button>
                    </Link>
                ) : (
                    "-"
                );
            },
        },
    ];

    return (
        <>
            <Head title="Laporan Laba" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <DollarOutlined style={{ marginRight: 8 }} />
                            LAPORAN LABA
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
                            <Col xs={24} lg={8}>
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
                            <Col xs={24} lg={isAdmin ? 4 : 8}>
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
                        <Col xs={24} sm={12} md={6}>
                            <Link
                                href={`/account/reports/profit?start_date=${filters.start_date}&end_date=${filters.end_date}`}
                            >
                                <Card size="small" hoverable>
                                    <Statistic
                                        title="Pendapatan"
                                        value={formatRupiah(summary.total_revenue)}
                                        valueStyle={{
                                            color: "#52c41a",
                                            fontSize: 18,
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Transaksi: {summary.total_transactions}
                                        {summary.average_sale > 0 && (
                                            <>
                                                {" "}
                                                · Rata-rata:{" "}
                                                {formatRupiah(summary.average_sale)}
                                            </>
                                        )}
                                    </Text>
                                </Card>
                            </Link>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="HPP"
                                    value={formatRupiah(summary.total_cost)}
                                    valueStyle={{ color: "#ff4d4f", fontSize: 18 }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Margin: {summary.profit_margin}%
                                    {summary.net_margin_pct != null && (
                                        <> · Net: {summary.net_margin_pct}%</>
                                    )}
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Laba Kotor"
                                    value={formatRupiah(summary.gross_profit)}
                                    valueStyle={{ color: "#1677ff", fontSize: 18 }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Sebelum expense
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Laba Bersih"
                                    value={formatRupiah(summary.net_profit)}
                                    valueStyle={{
                                        color:
                                            summary.net_profit >= 0
                                                ? "#52c41a"
                                                : "#ff4d4f",
                                        fontSize: 18,
                                    }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Expense:{" "}
                                    {formatRupiah(summary.total_expense)}
                                </Text>
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={profits.data}
                        pagination={false}
                        scroll={{ x: 900 }}
                        locale={{
                            emptyText:
                                "Belum ada data laba untuk filter ini.",
                        }}
                    />

                    <Pagination
                        links={profits.links}
                        meta={profits}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
