import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah, formatRupiahCompact } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
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
    ReloadOutlined,
    ScheduleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "open", label: "Buka" },
    { value: "closed", label: "Tutup" },
];

export default function ShiftSalesReport() {
    const {
        shifts,
        summary,
        filters = {},
        cashiers = [],
        isAdmin = false,
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};

    const [dateRange, setDateRange] = useState([
        dayjs(filters.start_date),
        dayjs(filters.end_date),
    ]);
    const [cashierId, setCashierId] = useState(
        filters.cashier_id || undefined,
    );
    const [status, setStatus] = useState(filters.status || "");

    const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
    const endDate = dateRange?.[1]?.format("YYYY-MM-DD");

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/shift-sales", {
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId || "",
            status: status || "",
        });
    };

    const handleReset = () => {
        const defaultRange = [dayjs(), dayjs()];
        setDateRange(defaultRange);
        setCashierId(undefined);
        setStatus("");
        router.get("/account/reports/shift-sales", {
            start_date: defaultRange[0].format("YYYY-MM-DD"),
            end_date: defaultRange[1].format("YYYY-MM-DD"),
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId || "",
            status: status || "",
        });
        window.location.href = `/account/reports/shift-sales/export?${params.toString()}`;
    };

    const formatTime = (value) => {
        if (!value) return null;
        return dayjs(value).format("HH:mm");
    };

    const formatDate = (value) => {
        if (!value) return "-";
        return dayjs(value).format("DD/MM/YYYY");
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (shifts.current_page - 1) * shifts.per_page,
        },
        {
            title: "Tanggal",
            render: (_, row) => formatDate(row.opened_at),
        },
        {
            title: "Shift",
            render: (_, row) => (
                <Space size={4}>
                    <Text strong>#{row.id}</Text>
                    <Tag color={row.status === "open" ? "processing" : "default"}>
                        {row.status === "open" ? "Buka" : "Tutup"}
                    </Tag>
                </Space>
            ),
        },
        {
            title: "Kasir",
            render: (_, row) => row.user?.name || "-",
        },
        {
            title: "Jam",
            render: (_, row) => {
                const open = formatTime(row.opened_at);
                const close = formatTime(row.closed_at);
                return close ? `${open} – ${close}` : `${open} –`;
            },
        },
        {
            title: "Trx",
            align: "center",
            render: (_, row) => (
                <div>
                    <Text strong>{row.trx_count}</Text>
                    {row.paid_count > 0 && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                lunas: {row.paid_count}
                            </Text>
                        </div>
                    )}
                    {row.pending_count > 0 && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                pending: {row.pending_count}
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Total Penjualan",
            align: "right",
            render: (_, row) => (
                <div>
                    <Text strong style={{ color: "var(--brand-primary)" }}>
                        {formatRupiah(row.total_penjualan)}
                    </Text>
                    {row.ppob_tunai > 0 && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                PPOB tunai: {formatRupiah(row.ppob_tunai)}
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Non Tunai",
            align: "right",
            render: (_, row) => (
                <Text style={{ color: "var(--semantic-info)" }}>
                    {formatRupiah(row.non_tunai)}
                </Text>
            ),
        },
        {
            title: "Pengeluaran",
            align: "right",
            render: (_, row) => (
                <Text style={{ color: "var(--semantic-warning)" }}>
                    {formatRupiah(row.pengeluaran || 0)}
                </Text>
            ),
        },
        {
            title: "Kelebihan",
            align: "right",
            render: (_, row) => (
                <Text style={{ color: "var(--semantic-warning)" }}>
                    {formatRupiah(row.kelebihan || 0)}
                </Text>
            ),
        },
        {
            title: "Kas Disetor",
            align: "right",
            render: (_, row) => {
                const diff = row.difference;
                let selisihColor;
                if (diff < 0) selisihColor = "var(--semantic-error)";
                else if (diff > 0) selisihColor = "var(--semantic-warning)";

                return (
                    <div>
                        <Text strong>{formatRupiah(row.kas_disetor || 0)}</Text>
                        {diff !== 0 && (
                            <div>
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 12,
                                        color: selisihColor,
                                    }}
                                >
                                    selisih: {formatRupiah(diff)}
                                </Text>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Aksi",
            width: 80,
            align: "center",
            render: (_, row) => (
                <Link href={`/account/cashier-shifts/${row.id}`}>
                    <Button size="small" icon={<EyeOutlined />} />
                </Link>
            ),
        },
    ];

    return (
        <>
            <Head title="Penjualan per Shift" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <ScheduleOutlined style={{ marginRight: 8 }} />
                            PENJUALAN PER SHIFT
                        </Title>
                    }
                >
                    <form onSubmit={handleFilter}>
                        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                            <Col xs={24} lg={8}>
                                <DatePicker.RangePicker
                                    style={{ width: "100%" }}
                                    format="DD/MM/YYYY"
                                    allowClear={false}
                                    value={dateRange}
                                    onChange={(v) => setDateRange(v)}
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
                            <Col xs={24} lg={4}>
                                <Select
                                    style={{ width: "100%" }}
                                    value={status}
                                    onChange={setStatus}
                                    options={statusOptions}
                                />
                            </Col>
                            <Col xs={24} lg={isAdmin ? 8 : 12}>
                                <Space wrap>
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
                                    {hasAnyPermission(
                                        ["reports.export"],
                                        permissions,
                                    ) && (
                                        <Button
                                            icon={<FileExcelOutlined />}
                                            onClick={handleExport}
                                        >
                                            Export Excel
                                        </Button>
                                    )}
                                </Space>
                            </Col>
                        </Row>
                    </form>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={12} sm={8} md={3}>
                            <Card size="small">
                                <Statistic
                                    title="Total Shift"
                                    value={summary.total_shifts}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Buka: {summary.open_shifts}
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={3}>
                            <Card size="small">
                                <Statistic
                                    title="Transaksi"
                                    value={summary.total_transactions}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Lunas: {summary.paid_transactions}
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={3}>
                            <Card size="small">
                                <Statistic
                                    title="Total Penjualan"
                                    value={formatRupiahCompact(summary.total_penjualan)}
                                    valueStyle={{
                                        color: "var(--brand-primary)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={3}>
                            <Card size="small">
                                <Statistic
                                    title="Non Tunai"
                                    value={formatRupiahCompact(summary.non_tunai)}
                                    valueStyle={{
                                        color: "var(--semantic-info)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={3}>
                            <Card size="small">
                                <Statistic
                                    title="Pengeluaran"
                                    value={formatRupiahCompact(summary.total_pengeluaran)}
                                    valueStyle={{
                                        color: "var(--semantic-warning)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={3}>
                            <Card size="small">
                                <Statistic
                                    title="Kelebihan"
                                    value={formatRupiahCompact(summary.total_kelebihan)}
                                    valueStyle={{
                                        color: "var(--semantic-warning)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={3}>
                            <Card size="small">
                                <Statistic
                                    title="Kas Disetor"
                                    value={formatRupiahCompact(summary.total_kas_disetor)}
                                    valueStyle={{ fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={shifts.data}
                        pagination={false}
                        scroll={{ x: "max-content" }}
                        locale={{
                            emptyText:
                                "Belum ada data shift untuk filter ini.",
                        }}
                    />

                    <Pagination
                        links={shifts.links}
                        meta={shifts}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
