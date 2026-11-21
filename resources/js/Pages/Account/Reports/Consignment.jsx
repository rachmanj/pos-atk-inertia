import LayoutAccount from "../../../Layouts/Account";
import DatePreset from "../../../Shared/DatePreset";
import hasAnyPermission from "../../../Utils/Permissions";
import {
    formatDateOnly,
    formatRupiahCompact,
} from "../../../Utils/format";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Grid,
    List,
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
    InboxOutlined,
    ReloadOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatQtyAxis = (value) => {
    const num = Number(value) || 0;
    const abs = Math.abs(num);
    if (abs >= 1_000_000) {
        return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(num / 1_000_000)} jt`;
    }
    if (abs >= 1_000) {
        return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(num / 1_000)} rb`;
    }
    return new Intl.NumberFormat("id-ID").format(num);
};

export default function ConsignmentReport() {
    const {
        summary = {},
        bySupplier = [],
        details = [],
        filters = {},
        suppliers = [],
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [dateRange, setDateRange] = useState([
        dayjs(filters.start_date),
        dayjs(filters.end_date),
    ]);
    const [supplierId, setSupplierId] = useState(
        filters.supplier_id ? Number(filters.supplier_id) : undefined,
    );

    const startDate = dateRange?.[0]?.format("YYYY-MM-DD") || "";
    const endDate = dateRange?.[1]?.format("YYYY-MM-DD") || "";

    const applyFilters = (overrides = {}) => {
        router.get("/account/reports/consignment", {
            start_date: overrides.start_date ?? startDate,
            end_date: overrides.end_date ?? endDate,
            supplier_id: overrides.supplier_id ?? supplierId ?? "",
        });
    };

    const handleFilter = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const handleReset = () => {
        const start = dayjs().startOf("month");
        const end = dayjs();
        setDateRange([start, end]);
        setSupplierId(undefined);
        router.get("/account/reports/consignment", {
            start_date: start.format("YYYY-MM-DD"),
            end_date: end.format("YYYY-MM-DD"),
            supplier_id: "",
        });
    };

    const handleDatePreset = (start, end) => {
        setDateRange([dayjs(start), dayjs(end)]);
        applyFilters({ start_date: start, end_date: end });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            supplier_id: supplierId || "",
        });
        window.location.href = `/account/reports/consignment/export?${params.toString()}`;
    };

    const tealCardStyle = {
        borderColor: "var(--brand-primary)",
        background:
            "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(16,185,129,0.04) 100%)",
    };

    const supplierColumns = [
        {
            title: "No.",
            width: 56,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Supplier",
            dataIndex: "supplier_name",
            render: (value) => (
                <Text strong style={{ color: "var(--brand-primary)" }}>
                    {value}
                </Text>
            ),
        },
        {
            title: "Dititip",
            dataIndex: "qty_dititip",
            align: "right",
            render: (v) => formatQtyAxis(v),
        },
        {
            title: "Terjual",
            dataIndex: "qty_terjual",
            align: "right",
            render: (v) => (
                <Text style={{ color: "var(--semantic-success)" }}>
                    {formatQtyAxis(v)}
                </Text>
            ),
        },
        {
            title: "Retur",
            dataIndex: "qty_retur",
            align: "right",
            responsive: ["sm"],
            render: (v) => formatQtyAxis(v),
        },
        {
            title: "Sisa",
            dataIndex: "sisa",
            align: "right",
            render: (v) => formatQtyAxis(v),
        },
        {
            title: "Utang Belum Dibayar",
            dataIndex: "nilai_utang_belum_dibayar",
            align: "right",
            render: (v) => (
                <Text
                    strong
                    style={{
                        color:
                            v > 0
                                ? "var(--semantic-error)"
                                : "var(--semantic-success)",
                    }}
                >
                    {formatRupiahCompact(v)}
                </Text>
            ),
        },
    ];

    const detailColumns = [
        {
            title: "No.",
            width: 56,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Kode",
            dataIndex: "consignment_code",
            render: (v) => <Text code>{v}</Text>,
        },
        {
            title: "Tanggal",
            dataIndex: "received_date",
            width: 110,
            render: (v) => formatDateOnly(v),
        },
        {
            title: "Supplier",
            dataIndex: "supplier_name",
            responsive: ["md"],
            ellipsis: true,
        },
        {
            title: "Produk",
            dataIndex: "product_title",
            ellipsis: true,
        },
        {
            title: "Dititip",
            dataIndex: "qty_in",
            align: "right",
            width: 72,
            render: (v) => formatQtyAxis(v),
        },
        {
            title: "Terjual",
            dataIndex: "qty_terjual",
            align: "right",
            width: 72,
            render: (v) => formatQtyAxis(v),
        },
        {
            title: "Retur",
            dataIndex: "qty_retur",
            align: "right",
            width: 72,
            responsive: ["lg"],
            render: (v) => formatQtyAxis(v),
        },
        {
            title: "Sisa",
            dataIndex: "sisa",
            align: "right",
            width: 72,
            render: (v) => formatQtyAxis(v),
        },
        {
            title: "Harga Konsinyasi",
            dataIndex: "cost_price",
            align: "right",
            responsive: ["xl"],
            render: (v) => formatRupiahCompact(v),
        },
        {
            title: "Nilai Terjual",
            dataIndex: "nilai_terjual",
            align: "right",
            render: (v) => (
                <Text style={{ color: "var(--semantic-success)" }}>
                    {formatRupiahCompact(v)}
                </Text>
            ),
        },
    ];

    return (
        <>
            <Head title="Laporan Konsinyasi - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Space>
                            <InboxOutlined
                                style={{ color: "var(--brand-primary)" }}
                            />
                            <Title level={4} style={{ margin: 0 }}>
                                LAPORAN KONSINYASI
                            </Title>
                        </Space>
                    }
                    extra={
                        hasAnyPermission(["reports.consignment"], permissions) && (
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
                        <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} md={10} lg={8}>
                                <Space
                                    direction="vertical"
                                    size={4}
                                    style={{ width: "100%" }}
                                >
                                    <Text type="secondary">Rentang tanggal</Text>
                                    <RangePicker
                                        value={dateRange}
                                        onChange={(vals) =>
                                            setDateRange(vals || [])
                                        }
                                        style={{ width: "100%" }}
                                        format="DD/MM/YYYY"
                                    />
                                    <DatePreset onApply={handleDatePreset} />
                                </Space>
                            </Col>
                            <Col xs={24} md={8} lg={6}>
                                <Space
                                    direction="vertical"
                                    size={4}
                                    style={{ width: "100%" }}
                                >
                                    <Text type="secondary">Supplier</Text>
                                    <Select
                                        allowClear
                                        showSearch
                                        placeholder="Semua supplier"
                                        optionFilterProp="label"
                                        value={supplierId}
                                        onChange={(v) => setSupplierId(v)}
                                        style={{ width: "100%" }}
                                        options={suppliers.map((s) => ({
                                            value: s.id,
                                            label: s.name,
                                        }))}
                                    />
                                </Space>
                            </Col>
                            <Col xs={24} md={6}>
                                <Space wrap style={{ marginTop: isMobile ? 0 : 22 }}>
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
                        </Row>
                    </form>

                    <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
                        <Col xs={12} sm={6}>
                            <Card size="small" style={tealCardStyle}>
                                <Statistic
                                    title="Total Dititip"
                                    value={formatQtyAxis(summary.qty_dititip || 0)}
                                    valueStyle={{
                                        color: "var(--brand-primary)",
                                        fontSize: isMobile ? 18 : 22,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small" style={tealCardStyle}>
                                <Statistic
                                    title="Total Terjual"
                                    value={formatQtyAxis(summary.qty_terjual || 0)}
                                    valueStyle={{
                                        color: "var(--semantic-success)",
                                        fontSize: isMobile ? 18 : 22,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Sisa"
                                    value={formatQtyAxis(summary.sisa || 0)}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Utang Belum Dibayar"
                                    value={formatRupiahCompact(
                                        summary.nilai_utang_belum_dibayar || 0,
                                    )}
                                    valueStyle={{
                                        color: "var(--semantic-error)",
                                        fontSize: isMobile ? 16 : 20,
                                    }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
                        <ShopOutlined style={{ color: "var(--brand-primary)" }} />{" "}
                        Ringkasan per Supplier
                    </Title>

                    {isMobile ? (
                        <List
                            dataSource={bySupplier}
                            locale={{ emptyText: "Tidak ada data pada periode ini." }}
                            renderItem={(record) => (
                                <List.Item key={record.supplier_id}>
                                    <Card size="small" style={{ width: "100%" }}>
                                        <Text strong style={{ color: "var(--brand-primary)" }}>
                                            {record.supplier_name}
                                        </Text>
                                        <Row gutter={8} style={{ marginTop: 8 }}>
                                            <Col span={12}>
                                                <Text type="secondary">Dititip</Text>
                                                <div>{formatQtyAxis(record.qty_dititip)}</div>
                                            </Col>
                                            <Col span={12}>
                                                <Text type="secondary">Terjual</Text>
                                                <div>{formatQtyAxis(record.qty_terjual)}</div>
                                            </Col>
                                            <Col span={12} style={{ marginTop: 8 }}>
                                                <Text type="secondary">Sisa</Text>
                                                <div>{formatQtyAxis(record.sisa)}</div>
                                            </Col>
                                            <Col span={12} style={{ marginTop: 8 }}>
                                                <Text type="secondary">Utang</Text>
                                                <div>
                                                    {formatRupiahCompact(
                                                        record.nilai_utang_belum_dibayar,
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Table
                            rowKey="supplier_id"
                            size="small"
                            pagination={false}
                            dataSource={bySupplier}
                            columns={supplierColumns}
                            locale={{ emptyText: "Tidak ada data pada periode ini." }}
                            scroll={{ x: 800 }}
                        />
                    )}

                    <Title level={5} style={{ marginTop: 28, marginBottom: 12 }}>
                        Rincian per Penerimaan & Produk
                    </Title>

                    {isMobile ? (
                        <List
                            dataSource={details}
                            locale={{ emptyText: "Tidak ada rincian pada periode ini." }}
                            renderItem={(record) => (
                                <List.Item key={record.consignment_item_id}>
                                    <Card size="small" style={{ width: "100%" }}>
                                        <Space direction="vertical" size={2}>
                                            <Text code>{record.consignment_code}</Text>
                                            <Text strong>{record.product_title}</Text>
                                            <Text type="secondary">
                                                {record.supplier_name} ·{" "}
                                                {formatDateOnly(record.received_date)}
                                            </Text>
                                        </Space>
                                        <Row gutter={8} style={{ marginTop: 8 }}>
                                            <Col span={8}>
                                                <Text type="secondary">Terjual</Text>
                                                <div>{formatQtyAxis(record.qty_terjual)}</div>
                                            </Col>
                                            <Col span={8}>
                                                <Text type="secondary">Sisa</Text>
                                                <div>{formatQtyAxis(record.sisa)}</div>
                                            </Col>
                                            <Col span={8}>
                                                <Text type="secondary">Nilai</Text>
                                                <div>
                                                    {formatRupiahCompact(record.nilai_terjual)}
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Table
                            rowKey="consignment_item_id"
                            size="small"
                            pagination={{
                                pageSize: 20,
                                showSizeChanger: true,
                                showTotal: (t) => `${t} baris`,
                            }}
                            dataSource={details}
                            columns={detailColumns}
                            locale={{ emptyText: "Tidak ada rincian pada periode ini." }}
                            scroll={{ x: 1100 }}
                        />
                    )}

                    <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
                        Periode penerimaan: {formatDateOnly(filters.start_date)} —{" "}
                        {formatDateOnly(filters.end_date)}. Qty terjual/retur mengikuti
                        transaksi & retur dalam rentang; jika tidak ada aktivitas di periode,
                        ditampilkan total kumulatif baris.
                    </Text>
                </Card>
            </LayoutAccount>
        </>
    );
}