import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, SEMANTIC } from "../../../theme/colors";
import {
    Alert,
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
    ExportOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const reasonLabels = {
    defect: "Barang Rusak",
    expired: "Kedaluwarsa",
    wrong_item: "Barang Tidak Sesuai",
    other: "Lainnya",
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

export default function SupplierReturnShow() {
    const { supplierReturn, flash } = usePage().props;
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
                <Text strong style={{ color: SEMANTIC.error }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>{`Retur Supplier ${supplierReturn.invoice} - VASIA Stationery`}</title>
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
                                <ExportOutlined
                                    style={{ fontSize: 20, color: BRAND.primary }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    DETAIL RETUR SUPPLIER
                                </Title>
                            </Space>
                            <Space wrap>
                                <Link href="/account/supplier-returns">
                                    <Button icon={<ArrowLeftOutlined />}>
                                        KEMBALI
                                    </Button>
                                </Link>
                                <Link
                                    href={`/account/purchases/${supplierReturn.purchase?.invoice}`}
                                >
                                    <Button
                                        type="primary"
                                        icon={<ShoppingOutlined />}
                                    >
                                        PEMBELIAN ASAL
                                    </Button>
                                </Link>
                            </Space>
                        </Space>

                        {flash.success && (
                            <Alert
                                type="success"
                                message={flash.success}
                                showIcon
                            />
                        )}
                        {flash.error && (
                            <Alert
                                type="error"
                                message={flash.error}
                                showIcon
                            />
                        )}

                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={8}>
                                <InfoCard label="Invoice Retur">
                                    <Text
                                        strong
                                        style={{
                                            color: SEMANTIC.error,
                                            fontSize: 16,
                                            display: "block",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {supplierReturn.invoice}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Tanggal Retur
                                    </Text>
                                    <Text strong>
                                        {new Date(
                                            supplierReturn.return_date,
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
                                        {supplierReturn.supplier?.name || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: "block" }}
                                    >
                                        {supplierReturn.supplier?.no_telp ||
                                            "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: "block" }}
                                    >
                                        {supplierReturn.supplier?.email || "-"}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: "block",
                                            marginTop: 8,
                                        }}
                                    >
                                        {supplierReturn.supplier?.address ||
                                            "-"}
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
                                        Invoice Pembelian:{" "}
                                        {supplierReturn.purchase?.invoice || "-"}
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        Total Qty: {supplierReturn.total_qty}
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            color: SEMANTIC.error,
                                            fontSize: 16,
                                            display: "block",
                                            marginBottom: 8,
                                        }}
                                    >
                                        {formatRupiah(
                                            supplierReturn.total_amount,
                                        )}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Dibuat oleh:{" "}
                                        {supplierReturn.user?.name || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Card size="small" title="Alasan Retur">
                                    <Text>
                                        {reasonLabels[supplierReturn.reason] ||
                                            supplierReturn.reason}
                                    </Text>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card size="small" title="Catatan">
                                    <Text>{supplierReturn.note || "-"}</Text>
                                </Card>
                            </Col>
                        </Row>

                        <Card title="Detail Item Retur">
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={supplierReturn.details}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                locale={{
                                    emptyText:
                                        "Belum ada item pada retur supplier ini.",
                                }}
                            />
                        </Card>
                    </Space>
                </Spin>
            </LayoutAccount>
        </>
    );
}
