import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    FileExcelOutlined,
    FilterOutlined,
    HistoryOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function ProductSalesHistory() {
    const {
        product,
        summary,
        filters = {},
        cashiers = [],
        transactions,
    } = usePage().props;

    const [dateRange, setDateRange] = useState(
        filters.start_date && filters.end_date
            ? [dayjs(filters.start_date), dayjs(filters.end_date)]
            : null,
    );
    const [cashierId, setCashierId] = useState(
        filters.cashier_id || undefined,
    );

    const handleFilter = (e) => {
        e.preventDefault();

        router.get(`/account/products/${product.id}/sales-history`, {
            start_date: dateRange?.[0]?.format("YYYY-MM-DD") || "",
            end_date: dateRange?.[1]?.format("YYYY-MM-DD") || "",
            cashier_id: cashierId || "",
        });
    };

    const handleReset = () => {
        setDateRange(null);
        setCashierId(undefined);
        router.get(`/account/products/${product.id}/sales-history`);
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            start_date: dateRange?.[0]?.format("YYYY-MM-DD") || "",
            end_date: dateRange?.[1]?.format("YYYY-MM-DD") || "",
            cashier_id: cashierId || "",
        });

        window.location.href = `/account/products/${product.id}/sales-history/export?${params.toString()}`;
    };

    const columns = [
        { title: "Waktu", dataIndex: "waktu", width: 140 },
        {
            title: "No. Invoice",
            dataIndex: "invoice",
            render: (invoice) => (
                <Link href={`/account/transactions/${invoice}`}>
                    {invoice}
                </Link>
            ),
        },
        { title: "Kasir", dataIndex: "cashier" },
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
        {
            title: "Laba",
            dataIndex: "laba",
            align: "right",
            render: (value) => formatRupiah(value),
        },
    ];

    return (
        <>
            <Head title={`Riwayat Penjualan - ${product.title}`} />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <HistoryOutlined style={{ marginRight: 8 }} />
                            RIWAYAT PENJUALAN
                        </Title>
                    }
                    extra={
                        <Link href="/account/products">
                            <Button icon={<ArrowLeftOutlined />}>
                                Kembali ke Produk
                            </Button>
                        </Link>
                    }
                >
                    <Descriptions
                        bordered
                        size="small"
                        column={{ xs: 1, sm: 2, md: 3 }}
                        style={{ marginBottom: 24 }}
                    >
                        <Descriptions.Item label="Produk">
                            <Text strong>{product.title}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Barcode">
                            {product.barcode || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kategori">
                            {product.category || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Stok Saat Ini">
                            <Tag color={product.stock > 0 ? "success" : "error"}>
                                {product.stock} {product.unit}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Harga Jual">
                            {formatRupiah(product.sell_price)}
                        </Descriptions.Item>
                    </Descriptions>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Transaksi"
                                    value={summary.total_transaksi}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total Qty"
                                    value={summary.total_qty}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Omzet"
                                    value={formatRupiah(summary.total_omzet)}
                                    valueStyle={{
                                        color: "var(--semantic-success)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Laba"
                                    value={formatRupiah(summary.total_laba)}
                                    valueStyle={{
                                        color: "var(--semantic-info)",
                                        fontSize: 18,
                                    }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <form onSubmit={handleFilter}>
                        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                            <Col xs={24} md={8}>
                                <RangePicker
                                    style={{ width: "100%" }}
                                    format="DD/MM/YYYY"
                                    placeholder={["Tanggal mulai", "Tanggal akhir"]}
                                    value={dateRange}
                                    onChange={setDateRange}
                                />
                            </Col>
                            <Col xs={24} md={6}>
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
                            <Col xs={24} md={10}>
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
                                    <Button
                                        icon={<FileExcelOutlined />}
                                        onClick={handleExport}
                                    >
                                        Export Excel
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </form>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={transactions.data}
                        pagination={false}
                        scroll={{ x: "max-content" }}
                        locale={{
                            emptyText:
                                "Belum ada penjualan untuk produk ini.",
                        }}
                    />

                    <Pagination
                        links={transactions.links}
                        meta={transactions}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
