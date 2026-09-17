import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import DatePreset from "../../../Shared/DatePreset";
import { formatRupiah } from "../../../Utils/format";
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
    Typography,
} from "antd";
import {
    FileDoneOutlined,
    FileExcelOutlined,
    FilterOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatTaxRate = (value) => {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return "-";
    }

    return `${numeric % 1 === 0 ? numeric.toFixed(0) : numeric}%`;
};

export default function PurchaseTaxReport() {
    const { purchases, summary, filters = {}, suppliers = [] } = usePage().props;

    const [dateRange, setDateRange] = useState([
        dayjs(filters.start_date),
        dayjs(filters.end_date),
    ]);
    const [supplierId, setSupplierId] = useState(
        filters.supplier_id || undefined,
    );

    const startDate = dateRange?.[0]?.format("YYYY-MM-DD") || "";
    const endDate = dateRange?.[1]?.format("YYYY-MM-DD") || "";

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/purchase-tax", {
            start_date: startDate,
            end_date: endDate,
            supplier_id: supplierId || "",
        });
    };

    const handleReset = () => {
        const defaultRange = [dayjs().startOf("month"), dayjs()];
        setDateRange(defaultRange);
        setSupplierId(undefined);
        router.get("/account/reports/purchase-tax", {
            start_date: defaultRange[0].format("YYYY-MM-DD"),
            end_date: defaultRange[1].format("YYYY-MM-DD"),
        });
    };

    const handleDatePreset = (start, end) => {
        setDateRange([dayjs(start), dayjs(end)]);
        router.get("/account/reports/purchase-tax", {
            start_date: start,
            end_date: end,
            supplier_id: supplierId || "",
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            supplier_id: supplierId || "",
        });
        window.location.href = `/account/reports/purchase-tax/export?${params.toString()}`;
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (purchases.current_page - 1) * purchases.per_page,
        },
        {
            title: "Tanggal",
            dataIndex: "purchase_date",
            render: (value) =>
                value ? new Date(value).toLocaleDateString("id-ID") : "-",
        },
        {
            title: "Invoice",
            dataIndex: "invoice",
            render: (invoice) => (
                <Link href={`/account/purchases/${invoice}`}>
                    <Text style={{ color: "var(--semantic-info)" }}>
                        {invoice}
                    </Text>
                </Link>
            ),
        },
        {
            title: "Supplier",
            render: (_, row) => row.supplier?.name ?? "-",
        },
        {
            title: "DPP",
            align: "right",
            dataIndex: "dpp_amount",
            render: (value) => formatRupiah(value ?? 0),
        },
        {
            title: "PPN",
            align: "right",
            dataIndex: "tax_amount",
            render: (value) => formatRupiah(value ?? 0),
        },
        {
            title: "Total",
            align: "right",
            dataIndex: "total_amount",
            render: (value) => (
                <Text strong style={{ color: "var(--semantic-success)" }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
        {
            title: "Tarif",
            width: 72,
            align: "center",
            dataIndex: "tax_rate",
            render: (value) => formatTaxRate(value),
        },
    ];

    return (
        <>
            <Head title="Laporan PPN Masukan" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <FileDoneOutlined style={{ marginRight: 8 }} />
                            LAPORAN PPN MASUKAN
                        </Title>
                    }
                    extra={
                        <Button
                            type="primary"
                            icon={<FileExcelOutlined />}
                            onClick={handleExport}
                        >
                            Export Excel
                        </Button>
                    }
                >
                    <form onSubmit={handleFilter}>
                        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                            <Col xs={24} lg={10}>
                                <RangePicker
                                    style={{ width: "100%" }}
                                    format="DD/MM/YYYY"
                                    allowClear={false}
                                    value={dateRange}
                                    onChange={(value) => setDateRange(value)}
                                />
                            </Col>
                            <Col xs={24} lg={8}>
                                <Select
                                    style={{ width: "100%" }}
                                    placeholder="Semua Supplier"
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    value={supplierId}
                                    onChange={setSupplierId}
                                    options={suppliers.map((supplier) => ({
                                        value: String(supplier.id),
                                        label: supplier.name,
                                    }))}
                                />
                            </Col>
                            <Col xs={24} lg={6}>
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
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Jumlah Nota"
                                    value={summary.total_count}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total DPP"
                                    value={formatRupiah(summary.total_dpp)}
                                    valueStyle={{ fontSize: 18 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total PPN"
                                    value={formatRupiah(summary.total_tax)}
                                    valueStyle={{
                                        color: "var(--semantic-warning)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Dibayar"
                                    value={formatRupiah(summary.total_amount)}
                                    valueStyle={{
                                        color: "var(--semantic-success)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={purchases.data}
                        pagination={false}
                        scroll={{ x: "max-content" }}
                        locale={{
                            emptyText:
                                "Belum ada pembelian untuk filter ini.",
                        }}
                    />

                    <Pagination
                        links={purchases.links}
                        meta={purchases}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
