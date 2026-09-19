import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import {
    formatPurchaseDueDate,
    purchasePaymentStatusColor,
    purchasePaymentStatusLabel,
} from "../../../Utils/purchasePayables";
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
    Spin,
    Statistic,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    AccountBookOutlined,
    FilterOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function PurchasePayables() {
    const {
        purchases,
        summary = {},
        filters = {},
        suppliers = [],
    } = usePage().props;

    const loading = useInertiaLoading();
    const buckets = summary.buckets || {};

    const [dateRange, setDateRange] = useState([
        filters.start_date ? dayjs(filters.start_date) : dayjs().startOf("month"),
        filters.end_date ? dayjs(filters.end_date) : dayjs(),
    ]);
    const [supplierId, setSupplierId] = useState(
        filters.supplier_id || undefined,
    );

    const startDate = dateRange?.[0]?.format("YYYY-MM-DD") || "";
    const endDate = dateRange?.[1]?.format("YYYY-MM-DD") || "";

    const handleFilter = (e) => {
        e.preventDefault();
        router.get("/account/reports/purchase-payables", {
            start_date: startDate,
            end_date: endDate,
            supplier_id: supplierId || "",
        });
    };

    const handleReset = () => {
        const range = [dayjs().startOf("month"), dayjs()];
        setDateRange(range);
        setSupplierId(undefined);
        router.get("/account/reports/purchase-payables", {
            start_date: range[0].format("YYYY-MM-DD"),
            end_date: range[1].format("YYYY-MM-DD"),
        });
    };

    const summaryCards = [
        {
            title: "Total Utang",
            value: formatRupiah(summary.total_payable || 0),
            highlight: true,
        },
        {
            title: "Jumlah Nota",
            value: summary.invoice_count || 0,
        },
        {
            title: "Belum Jatuh Tempo",
            value: formatRupiah(buckets.not_due?.total_remaining || 0),
            sub: `${buckets.not_due?.count || 0} nota`,
        },
        {
            title: "1–30 Hari",
            value: formatRupiah(buckets["1_30"]?.total_remaining || 0),
            sub: `${buckets["1_30"]?.count || 0} nota`,
        },
        {
            title: ">30 Hari",
            value: formatRupiah(buckets.over_30?.total_remaining || 0),
            sub: `${buckets.over_30?.count || 0} nota`,
        },
    ];

    const columns = [
        {
            title: "Tanggal Nota",
            dataIndex: "purchase_date",
            render: (value) => formatPurchaseDueDate(value),
        },
        {
            title: "Invoice",
            dataIndex: "invoice",
            render: (value) => (
                <Link href={`/account/purchases/${value}`}>
                    <Text strong style={{ color: "var(--brand-primary)" }}>
                        {value}
                    </Text>
                </Link>
            ),
        },
        {
            title: "Supplier",
            render: (_, record) => record.supplier?.name || "-",
        },
        {
            title: "Total",
            align: "right",
            dataIndex: "total_amount",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Dibayar",
            align: "right",
            dataIndex: "paid_amount",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Sisa",
            align: "right",
            dataIndex: "remaining",
            render: (value) => (
                <Text strong style={{ color: "var(--semantic-error)" }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
        {
            title: "Jatuh Tempo",
            dataIndex: "due_date",
            render: (value) => formatPurchaseDueDate(value),
        },
        {
            title: "Umur",
            dataIndex: "age_label",
            render: (value) => value || "-",
        },
        {
            title: "Status",
            dataIndex: "payment_status",
            render: (value) => (
                <Tag color={purchasePaymentStatusColor(value)}>
                    {purchasePaymentStatusLabel(value)}
                </Tag>
            ),
        },
    ];

    return (
        <LayoutAccount>
            <Head title="Utang Supplier - VASIA Stationery" />
            <Spin spinning={loading}>
                <Card
                    title={
                        <Space>
                            <AccountBookOutlined
                                style={{ color: "var(--brand-primary)" }}
                            />
                            <Title level={4} style={{ margin: 0 }}>
                                UTANG SUPPLIER
                            </Title>
                        </Space>
                    }
                >
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {summaryCards.map((card) => (
                            <Col key={card.title} xs={24} sm={12} md={8} lg={4}>
                                <Card size="small">
                                    <Statistic
                                        title={
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 11 }}
                                            >
                                                {card.title}
                                            </Text>
                                        }
                                        value={card.value}
                                        valueStyle={
                                            card.highlight
                                                ? {
                                                      color: "var(--semantic-error)",
                                                      fontSize: 18,
                                                  }
                                                : { fontSize: 18 }
                                        }
                                    />
                                    {card.sub && (
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 11 }}
                                        >
                                            {card.sub}
                                        </Text>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <form onSubmit={handleFilter} style={{ marginBottom: 16 }}>
                        <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} md={10}>
                                <RangePicker
                                    style={{ width: "100%" }}
                                    format="YYYY-MM-DD"
                                    value={dateRange}
                                    onChange={(values) =>
                                        setDateRange(values || [])
                                    }
                                />
                            </Col>
                            <Col xs={24} md={8}>
                                <Select
                                    allowClear
                                    placeholder="Semua Supplier"
                                    style={{ width: "100%" }}
                                    value={supplierId}
                                    onChange={setSupplierId}
                                    options={suppliers.map((supplier) => ({
                                        value: String(supplier.id),
                                        label: supplier.name,
                                    }))}
                                />
                            </Col>
                            <Col xs={24} md={6}>
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
                                </Space>
                            </Col>
                        </Row>
                    </form>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={purchases?.data || []}
                        pagination={false}
                        scroll={{ x: "max-content" }}
                        locale={{
                            emptyText:
                                "Tidak ada utang supplier pada periode filter ini.",
                        }}
                    />

                    {purchases?.links && (
                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={purchases.links}
                                align="end"
                                meta={{
                                    current_page: purchases.current_page,
                                    per_page: purchases.per_page,
                                    total: purchases.total,
                                }}
                            />
                        </div>
                    )}
                </Card>
            </Spin>
        </LayoutAccount>
    );
}
