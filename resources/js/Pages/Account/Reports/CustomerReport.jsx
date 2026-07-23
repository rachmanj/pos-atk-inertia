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
    Typography,
} from "antd";
import {
    FileExcelOutlined,
    FilterOutlined,
    ReloadOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function CustomerReport() {
    const {
        customers,
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
        router.get("/account/reports/customers", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId || "",
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setCashierId(undefined);
        router.get("/account/reports/customers");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/customers", {
            q: search,
            start_date: start,
            end_date: end,
            cashier_id: cashierId || "",
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId || "",
        });
        window.location.href = `/account/reports/customers/export?${params.toString()}`;
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
                index + 1 + (customers.current_page - 1) * customers.per_page,
        },
        {
            title: "Pelanggan",
            render: (_, item) => (
                <Text strong>{item.customer?.name ?? "-"}</Text>
            ),
        },
        {
            title: "No HP",
            render: (_, item) => item.customer?.no_telp ?? "-",
        },
        {
            title: "Total Transaksi",
            align: "center",
            render: (_, item) => <Text strong>{item.total_transactions}</Text>,
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
            title: "Rata-rata",
            align: "right",
            render: (_, item) => (
                <Text style={{ color: "#1677ff" }}>
                    {formatRupiah(item.average_transaction)}
                </Text>
            ),
        },
        {
            title: "Kunjungan Terakhir",
            render: (_, item) => formatDate(item.last_visit),
        },
    ];

    return (
        <>
            <Head title="Laporan Pelanggan" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <TeamOutlined style={{ marginRight: 8 }} />
                            LAPORAN PELANGGAN
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
                                    placeholder="Cari pelanggan (nama/no HP)..."
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
                            <Col xs={24} lg={isAdmin ? 6 : 10}>
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
                            <Card size="small">
                                <Statistic
                                    title="Total Pelanggan"
                                    value={summary.total_customers}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Transaksi"
                                    value={summary.total_transactions}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Omzet"
                                    value={formatRupiah(summary.total_omzet)}
                                    valueStyle={{ color: "#52c41a", fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Rata-rata per Pelanggan"
                                    value={formatRupiah(summary.avg_per_customer)}
                                    valueStyle={{ color: "#1677ff", fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        rowKey="customer_id"
                        columns={columns}
                        dataSource={customers.data}
                        pagination={false}
                        scroll={{ x: 800 }}
                        locale={{
                            emptyText:
                                "Belum ada data pelanggan untuk filter ini.",
                        }}
                    />

                    <Pagination
                        links={customers.links}
                        meta={customers}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
