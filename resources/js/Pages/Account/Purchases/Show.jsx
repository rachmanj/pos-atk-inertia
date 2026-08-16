import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, SEMANTIC } from "../../../theme/colors";
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
    FileTextOutlined,
    PlusCircleOutlined,
    UndoOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

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

export default function PurchaseShow() {
    const { purchase, auth = {} } = usePage().props;
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
            title: "Qty",
            align: "center",
            dataIndex: "qty",
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Harga Beli",
            align: "right",
            dataIndex: "buy_price",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Subtotal",
            align: "right",
            dataIndex: "subtotal",
            render: (value) => (
                <Text strong style={{ color: SEMANTIC.success }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>{`Pembelian ${purchase.invoice} - VASIA Stationery`}</title>
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
                                <FileTextOutlined
                                    style={{ fontSize: 20, color: BRAND.primary }}
                                />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        DETAIL PEMBELIAN
                                    </Title>
                                    <Text type="secondary">
                                        Invoice: {purchase.invoice}
                                    </Text>
                                </div>
                            </Space>
                            <Space wrap>
                                <Link href="/account/purchases">
                                    <Button icon={<ArrowLeftOutlined />}>
                                        KEMBALI
                                    </Button>
                                </Link>
                                {hasAnyPermission(
                                    ["purchases.create"],
                                    permissions,
                                ) && (
                                    <Link href="/account/purchases/create">
                                        <Button
                                            type="primary"
                                            icon={<PlusCircleOutlined />}
                                        >
                                            PEMBELIAN BARU
                                        </Button>
                                    </Link>
                                )}
                                {hasAnyPermission(
                                    ["supplier_returns.create"],
                                    permissions,
                                ) && (
                                    <Link
                                        href={`/account/supplier-returns/create/${purchase.invoice}`}
                                    >
                                        <Button
                                            danger
                                            icon={<UndoOutlined />}
                                        >
                                            RETUR SUPPLIER
                                        </Button>
                                    </Link>
                                )}
                            </Space>
                        </Space>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Invoice">
                                    <Text
                                        strong
                                        style={{
                                            color: BRAND.primary,
                                            fontSize: 16,
                                            display: "block",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {purchase.invoice}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Tanggal Pembelian
                                    </Text>
                                    <Text strong>
                                        {new Date(
                                            purchase.purchase_date,
                                        ).toLocaleDateString("id-ID")}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Supplier">
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        {purchase.supplier?.name || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: "block" }}
                                    >
                                        {purchase.supplier?.no_telp || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: "block" }}
                                    >
                                        {purchase.supplier?.email || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginTop: 8,
                                        }}
                                    >
                                        {purchase.supplier?.address || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Ringkasan">
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        Total Item: {purchase.total_items}
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        Total Qty: {purchase.total_qty}
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            color: SEMANTIC.success,
                                            fontSize: 16,
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        {formatRupiah(purchase.total_amount)}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Dibuat oleh: {purchase.user?.name || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                        </Row>

                        {purchase.note && (
                            <Card size="small" title="Catatan">
                                <Text>{purchase.note}</Text>
                            </Card>
                        )}

                        <Card title="Detail Item">
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={purchase.details}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                locale={{
                                    emptyText:
                                        "Belum ada item pada pembelian ini.",
                                }}
                            />
                        </Card>
                    </Space>
                </Spin>
            </LayoutAccount>
        </>
    );
}
