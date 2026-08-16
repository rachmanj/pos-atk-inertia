import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND } from "../../../theme/colors";
import {
    Button,
    Card,
    Col,
    Row,
    Space,
    Spin,
    Table,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    PlusCircleOutlined,
    ProfileOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const differenceType = (difference) => {
    if (difference > 0) return "success";
    if (difference < 0) return "danger";
    return "secondary";
};

function InfoCard({ label, children }) {
    return (
        <Card size="small" style={{ height: "100%" }}>
            <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
            >
                {label}
            </Text>
            {children}
        </Card>
    );
}

export default function StockOpnameShow() {
    const { stockOpname, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();

    const columns = [
        {
            title: "Produk",
            render: (_, detail) => (
                <div>
                    <Text strong>{detail.product?.title || "-"}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {detail.product?.unit || "-"}
                    </Text>
                </div>
            ),
        },
        {
            title: "Barcode",
            render: (_, detail) => detail.product?.barcode || "-",
        },
        {
            title: "Stok Sistem",
            align: "center",
            dataIndex: "system_stock",
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Stok Fisik",
            align: "center",
            dataIndex: "physical_stock",
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Selisih",
            align: "center",
            dataIndex: "difference_qty",
            render: (value) => (
                <Text strong type={differenceType(value)}>
                    {value > 0 ? `+${value}` : value}
                </Text>
            ),
        },
        {
            title: "Catatan Item",
            dataIndex: "note",
            render: (value) => value || "-",
        },
    ];

    return (
        <>
            <Head>
                <title>{`${stockOpname.code} - VASIA Stationery`}</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Space
                        direction="vertical"
                        size="large"
                        style={{ width: "100%" }}
                    >
                        <Space
                            style={{
                                width: "100%",
                                justifyContent: "space-between",
                            }}
                            wrap
                        >
                            <Space>
                                <ProfileOutlined
                                    style={{ fontSize: 20, color: BRAND.primary }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    DETAIL STOCK OPNAME
                                </Title>
                            </Space>
                            <Space wrap>
                                <Link href="/account/stock-opnames">
                                    <Button icon={<ArrowLeftOutlined />}>
                                        KEMBALI
                                    </Button>
                                </Link>
                                {hasAnyPermission(
                                    ["stock_opnames.create"],
                                    permissions,
                                ) && (
                                    <Link href="/account/stock-opnames/create">
                                        <Button
                                            type="primary"
                                            icon={<PlusCircleOutlined />}
                                        >
                                            OPNAME BARU
                                        </Button>
                                    </Link>
                                )}
                            </Space>
                        </Space>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Kode Opname">
                                    <Text
                                        strong
                                        style={{
                                            color: BRAND.primary,
                                            fontSize: 16,
                                            display: "block",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {stockOpname.code}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Tanggal Opname
                                    </Text>
                                    <Text strong>
                                        {new Date(
                                            stockOpname.opname_date,
                                        ).toLocaleDateString("id-ID")}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Pemeriksa">
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {stockOpname.user?.name || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Total Produk
                                    </Text>
                                    <Text strong>
                                        {stockOpname.total_items}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Total Selisih">
                                    <Text
                                        strong
                                        type={differenceType(
                                            stockOpname.total_difference_qty,
                                        )}
                                        style={{
                                            fontSize: 16,
                                            display: "block",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {stockOpname.total_difference_qty > 0
                                            ? `+${stockOpname.total_difference_qty}`
                                            : stockOpname.total_difference_qty}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Catatan
                                    </Text>
                                    <Text style={{ fontSize: 12 }}>
                                        {stockOpname.note || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                        </Row>

                        <Card title="Detail Item Opname">
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={stockOpname.details}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                locale={{
                                    emptyText:
                                        "Belum ada item pada stock opname ini.",
                                }}
                            />
                        </Card>
                    </Space>
                </Spin>
            </LayoutAccount>
        </>
    );
}
