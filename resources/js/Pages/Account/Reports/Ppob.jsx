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
    MobileOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function PpobReport() {
    const {
        ppobData,
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
    const [groupBy, setGroupBy] = useState(filters.group_by || "product");

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/ppob", {
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId || "",
            group_by: groupBy,
        });
    };

    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setCashierId(undefined);
        setGroupBy("product");
        router.get("/account/reports/ppob");
    };

    const handleDatePreset = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        router.get("/account/reports/ppob", {
            q: search,
            start_date: start,
            end_date: end,
            cashier_id: cashierId || "",
            group_by: groupBy,
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            q: search,
            start_date: startDate,
            end_date: endDate,
            cashier_id: cashierId || "",
            group_by: groupBy,
        });
        window.location.href = `/account/reports/ppob/export?${params.toString()}`;
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (ppobData.current_page - 1) * ppobData.per_page,
        },
        ...(groupBy === "date"
            ? [
                  {
                      title: "Tanggal",
                      dataIndex: "sale_date",
                  },
              ]
            : []),
        {
            title: "Produk",
            render: (_, item) => (
                <Text strong>{item.product?.title ?? "-"}</Text>
            ),
        },
        {
            title: "Qty",
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
            title: "Admin Fee",
            align: "right",
            render: (_, item) => (
                <Text style={{ color: "#1677ff" }}>
                    {formatRupiah(item.total_admin_fee)}
                </Text>
            ),
        },
        {
            title: "Modal (Cost)",
            align: "right",
            render: (_, item) => (
                <Text style={{ color: "#faad14" }}>
                    {formatRupiah(item.total_cost)}
                </Text>
            ),
        },
        {
            title: "Laba",
            align: "right",
            render: (_, item) => (
                <Text strong style={{ color: "#52c41a" }}>
                    {formatRupiah(item.total_laba)}
                </Text>
            ),
        },
    ];

    return (
        <>
            <Head title="Laporan PPOB" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <MobileOutlined style={{ marginRight: 8 }} />
                            LAPORAN PPOB
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
                                    placeholder="Cari produk PPOB..."
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
                                    value={groupBy}
                                    onChange={setGroupBy}
                                    options={[
                                        {
                                            value: "product",
                                            label: "Group Produk",
                                        },
                                        {
                                            value: "date",
                                            label: "Group Tanggal",
                                        },
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
                            <Card size="small">
                                <Statistic
                                    title="Total Omzet PPOB"
                                    value={formatRupiah(summary.total_omzet)}
                                    valueStyle={{ color: "#52c41a", fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Admin Fee"
                                    value={formatRupiah(summary.total_admin_fee)}
                                    valueStyle={{ color: "#1677ff", fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Modal (Cost)"
                                    value={formatRupiah(summary.total_cost)}
                                    valueStyle={{ color: "#faad14", fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Qty"
                                    value={summary.total_qty}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        rowKey={(item, index) =>
                            `${item.product_id}-${item.sale_date ?? index}`
                        }
                        columns={columns}
                        dataSource={ppobData.data}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        locale={{
                            emptyText:
                                "Belum ada data penjualan PPOB untuk filter ini.",
                        }}
                    />

                    <Pagination
                        links={ppobData.links}
                        meta={ppobData}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
