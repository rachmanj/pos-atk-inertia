import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage } from "@inertiajs/react";
import {
    Alert,
    Card,
    Col,
    Descriptions,
    Empty,
    List,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    ClockCircleOutlined,
    DollarOutlined,
    FileTextOutlined,
    LineChartOutlined,
    PieChartOutlined,
    ShoppingOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../../Utils/format";

const { Title, Text } = Typography;

const paymentMethodLabels = {
    cash: "Tunai",
    digital: "Digital",
};

const paymentStatusLabels = {
    unpaid: "Belum Bayar",
    pending: "Pending",
    paid: "Lunas",
    expired: "Expired",
    failed: "Gagal",
};

const paymentStatusColors = {
    unpaid: "default",
    pending: "warning",
    paid: "success",
    expired: "default",
    failed: "error",
};

const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const statIconColors = {
    primary: "#3b82f6",
    info: "#0ea5e9",
    success: "#22c55e",
    danger: "#ef4444",
    secondary: "#94a3b8",
};

function StatCard({ title, value, subtitle, icon, color }) {
    const iconColor = statIconColors[color] || statIconColors.primary;

    return (
        <Card>
            <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <Statistic
                    title={
                        <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase" }}>
                            {title}
                        </Text>
                    }
                    value={value}
                    valueStyle={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: color === "danger" ? statIconColors.danger : undefined,
                    }}
                />
                <div
                    style={{
                        width: 46,
                        height: 46,
                        borderRadius: 8,
                        background: `${iconColor}1a`,
                        color: iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
                {subtitle}
            </Text>
        </Card>
    );
}

export default function Dashboard() {
    const {
        auth,
        summary = {},
        activeShift,
        recentTransactions = [],
        lowStockProducts = [],
        ppobAccount = null,
    } = usePage().props;

    const netProfitColor =
        Number(summary.today_net_profit || 0) < 0 ? "danger" : "success";
    const lowStockColor =
        Number(summary.low_stock_count || 0) > 0 ? "danger" : "secondary";

    const stats = [
        {
            title: "Penjualan Bruto Hari Ini",
            value: formatRupiah(summary.today_sales || 0),
            subtitle: `${summary.today_transactions || 0} transaksi lunas aktif, tidak termasuk void`,
            icon: <DollarOutlined />,
            color: "primary",
        },
        {
            title: "Transaksi Hari Ini",
            value: summary.today_transactions || 0,
            subtitle: `Rata-rata ${formatRupiah(summary.today_average_sale || 0)}`,
            icon: <FileTextOutlined />,
            color: "info",
        },
        {
            title: "Laba Bersih",
            value: formatRupiah(summary.today_net_profit || 0),
            subtitle: `Pengeluaran ${formatRupiah(summary.today_expense || 0)}`,
            icon: <LineChartOutlined />,
            color: netProfitColor,
        },
        {
            title: "Stok Menipis",
            value: summary.low_stock_count || 0,
            subtitle: `Dari ${summary.active_products || 0} produk aktif`,
            icon: <ShoppingOutlined />,
            color: lowStockColor,
        },
    ];

    const transactionColumns = [
        {
            title: "Transaksi",
            dataIndex: "invoice",
            key: "invoice",
            render: (_, record) => (
                <div>
                    <Text strong>{record.invoice}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.customer?.name || "Umum"} ·{" "}
                        {paymentMethodLabels[record.payment_method] ||
                            record.payment_method}
                    </Text>
                </div>
            ),
        },
        {
            title: "Total",
            key: "total",
            align: "right",
            render: (_, record) => (
                <div>
                    <Text strong>{formatRupiah(record.grand_total)}</Text>
                    <br />
                    <Tag
                        color={
                            paymentStatusColors[record.payment_status] ||
                            "default"
                        }
                    >
                        {paymentStatusLabels[record.payment_status] ||
                            record.payment_status}
                    </Tag>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>Dashboard - ZenPOS</title>
            </Head>
            <LayoutAccount>
                <Space
                    direction="vertical"
                    size="large"
                    style={{ width: "100%" }}
                >
                    <FlexHeader
                        userName={auth.user.name}
                    />

                    <Row gutter={[16, 16]}>
                        {stats.map((stat) => (
                            <Col key={stat.title} xs={12} sm={6} xl={6}>
                                <StatCard {...stat} />
                            </Col>
                        ))}
                    </Row>

                    {ppobAccount && (
                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={6} xl={6}>
                                <Card
                                    style={
                                        ppobAccount.is_low_balance
                                            ? { borderColor: "#ef4444" }
                                            : undefined
                                    }
                                >
                                    <Statistic
                                        title={
                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: 12,
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                Saldo PPOB
                                            </Text>
                                        }
                                        value={formatRupiah(
                                            ppobAccount.current_balance,
                                        )}
                                        prefix={<WalletOutlined />}
                                        valueStyle={{
                                            color: ppobAccount.is_low_balance
                                                ? "#ef4444"
                                                : undefined,
                                            fontWeight: 700,
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {ppobAccount.name}
                                        {ppobAccount.is_low_balance
                                            ? " · Saldo rendah"
                                            : ""}
                                    </Text>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    <Row gutter={[16, 16]}>
                        <Col xs={24} xl={8}>
                            <Card
                                title={
                                    <Space>
                                        <ClockCircleOutlined
                                            style={{ color: "#0d9488" }}
                                        />
                                        Shift Kasir
                                    </Space>
                                }
                            >
                                {activeShift ? (
                                    <Space
                                        direction="vertical"
                                        size="middle"
                                        style={{ width: "100%" }}
                                    >
                                        <Space
                                            align="start"
                                            style={{
                                                width: "100%",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <div>
                                                <Text
                                                    type="secondary"
                                                    style={{
                                                        fontSize: 12,
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    Status
                                                </Text>
                                                <Title
                                                    level={5}
                                                    style={{
                                                        margin: 0,
                                                        color: "#22c55e",
                                                    }}
                                                >
                                                    Aktif
                                                </Title>
                                            </div>
                                            <Tag color="success">
                                                #{activeShift.id}
                                            </Tag>
                                        </Space>

                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Dibuka{" "}
                                            {formatDateTime(activeShift.opened_at)}
                                        </Text>

                                        <Descriptions
                                            column={1}
                                            size="small"
                                            colon={false}
                                            items={[
                                                {
                                                    key: "cash",
                                                    label: "Uang Awal",
                                                    children: formatRupiah(
                                                        activeShift.cash_in_hand,
                                                    ),
                                                },
                                                {
                                                    key: "sales",
                                                    label: "Penjualan Tunai",
                                                    children: formatRupiah(
                                                        activeShift.cash_sales,
                                                    ),
                                                },
                                                {
                                                    key: "expected",
                                                    label: "Estimasi Kas",
                                                    children: (
                                                        <Text
                                                            strong
                                                            style={{
                                                                color: "#22c55e",
                                                            }}
                                                        >
                                                            {formatRupiah(
                                                                activeShift.expected_cash,
                                                            )}
                                                        </Text>
                                                    ),
                                                },
                                                {
                                                    key: "transactions",
                                                    label: "Transaksi Shift",
                                                    children:
                                                        activeShift.total_transactions,
                                                },
                                            ]}
                                        />
                                    </Space>
                                ) : (
                                    <Empty
                                        image={
                                            <ClockCircleOutlined
                                                style={{
                                                    fontSize: 48,
                                                    color: "#94a3b8",
                                                }}
                                            />
                                        }
                                        description="Belum ada shift aktif"
                                    />
                                )}
                            </Card>
                        </Col>

                        <Col xs={24} xl={16}>
                            <Card
                                title={
                                    <Space>
                                        <PieChartOutlined
                                            style={{ color: "#3b82f6" }}
                                        />
                                        Pantauan Cepat
                                    </Space>
                                }
                            >
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} lg={14}>
                                        <Title level={5} style={{ marginTop: 0 }}>
                                            Transaksi Terakhir
                                        </Title>
                                        <Table
                                            columns={transactionColumns}
                                            dataSource={recentTransactions}
                                            rowKey="id"
                                            pagination={false}
                                            size="small"
                                            scroll={{ x: "max-content", y: 260 }}
                                            locale={{
                                                emptyText: "Belum ada transaksi.",
                                            }}
                                        />
                                    </Col>

                                    <Col xs={24} lg={10}>
                                        <Title level={5} style={{ marginTop: 0 }}>
                                            Stok Menipis
                                        </Title>
                                        {lowStockProducts.length > 0 ? (
                                            <List
                                                size="small"
                                                dataSource={lowStockProducts}
                                                style={{
                                                    maxHeight: 260,
                                                    overflowY: "auto",
                                                }}
                                                renderItem={(product) => (
                                                    <List.Item
                                                        actions={[
                                                            <Tag
                                                                color="error"
                                                                key="stock"
                                                            >
                                                                {product.stock}{" "}
                                                                {product.unit}
                                                            </Tag>,
                                                        ]}
                                                    >
                                                        <List.Item.Meta
                                                            title={
                                                                <Text strong>
                                                                    {product.title}
                                                                </Text>
                                                            }
                                                            description="Perlu restock"
                                                        />
                                                    </List.Item>
                                                )}
                                            />
                                        ) : (
                                            <Empty
                                                description="Stok aman."
                                                style={{ padding: "24px 0" }}
                                            />
                                        )}
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Space>
            </LayoutAccount>
        </>
    );
}

function FlexHeader({ userName }) {
    return (
        <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
        >
            <div>
                <Title level={4} style={{ marginBottom: 4 }}>
                    Dashboard
                </Title>
                <Text type="secondary">Ringkasan operasional hari ini</Text>
            </div>
            <Alert
                type="success"
                showIcon
                message={
                    <>
                        Selamat datang, <strong>{userName}</strong>
                    </>
                }
                style={{ marginBottom: 0 }}
            />
        </Space>
    );
}
