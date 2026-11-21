import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    formatDateOnly,
    formatRupiah,
    formatRupiahCompact,
} from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import {
    Alert,
    Button,
    Card,
    Col,
    Grid,
    List,
    Row,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
} from "antd";
import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";

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

const statusLabel = (status) => (status === "closed" ? "Ditutup" : "Aktif");
const statusColor = (status) => (status === "closed" ? "default" : "processing");

export default function ConsignmentShow() {
    const { consignment, totals = {}, flash = {} } = usePage().props;
    const loading = useInertiaLoading();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const itemColumns = [
        {
            title: "Produk",
            render: (_, item) => (
                <div>
                    <Text strong>{item.product?.title || "-"}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.product?.unit || "-"}
                    </Text>
                </div>
            ),
        },
        {
            title: "Barcode",
            responsive: ["md"],
            render: (_, item) => item.product?.barcode || "-",
        },
        {
            title: "Masuk",
            align: "center",
            dataIndex: "qty_in",
            width: 72,
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Terjual",
            align: "center",
            dataIndex: "qty_sold",
            width: 72,
            responsive: ["sm"],
            render: (value) => value ?? 0,
        },
        {
            title: "Retur",
            align: "center",
            dataIndex: "qty_returned",
            width: 72,
            responsive: ["sm"],
            render: (value) => value ?? 0,
        },
        {
            title: "Sisa",
            align: "center",
            dataIndex: "remaining_qty",
            width: 72,
            render: (value) => (
                <Text strong style={{ color: "var(--brand-primary)" }}>
                    {value ?? 0}
                </Text>
            ),
        },
        {
            title: "Harga / pcs",
            align: "right",
            dataIndex: "cost_price",
            width: 110,
            responsive: ["md"],
            render: (value) => formatRupiahCompact(value),
        },
        {
            title: "Nilai sisa",
            align: "right",
            dataIndex: "remaining_value",
            width: 120,
            render: (value) => (
                <Text strong style={{ color: "var(--semantic-success)" }}>
                    {formatRupiahCompact(value ?? 0)}
                </Text>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>
                    {consignment.code} - Konsinyasi - VASIA Stationery
                </title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space wrap>
                                <InboxOutlined
                                    style={{ color: "var(--brand-primary)" }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    {consignment.code}
                                </Title>
                                <Tag color={statusColor(consignment.status)}>
                                    {statusLabel(consignment.status)}
                                </Tag>
                            </Space>
                        }
                        extra={
                            <Link href="/account/consignments">
                                <Button icon={<ArrowLeftOutlined />}>
                                    KEMBALI
                                </Button>
                            </Link>
                        }
                    >
                        {flash.success && (
                            <Alert
                                type="success"
                                message={flash.success}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                            <Col xs={24} sm={12} md={6}>
                                <InfoCard label="Supplier">
                                    <Text strong>
                                        {consignment.supplier?.name || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <InfoCard label="Tanggal terima">
                                    <Text strong>
                                        {formatDateOnly(
                                            consignment.received_date,
                                        )}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <InfoCard label="Dicatat oleh">
                                    <Text>
                                        {consignment.user?.name || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <InfoCard label="Sisa qty / nilai">
                                    <Text strong>
                                        {totals.total_remaining_qty ?? 0} pcs ·{" "}
                                        {formatRupiahCompact(
                                            totals.total_remaining_value ?? 0,
                                        )}
                                    </Text>
                                </InfoCard>
                            </Col>
                        </Row>

                        {consignment.note && (
                            <Alert
                                type="info"
                                message={
                                    <span>
                                        <Text type="secondary">Catatan: </Text>
                                        {consignment.note}
                                    </span>
                                }
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <Card
                            size="small"
                            title="Rincian barang titipan"
                            style={{ marginBottom: 16 }}
                        >
                            {isMobile ? (
                                <List
                                    dataSource={consignment.items || []}
                                    locale={{ emptyText: "Tidak ada item." }}
                                    renderItem={(item) => (
                                        <List.Item key={item.id}>
                                            <List.Item.Meta
                                                title={
                                                    <Text strong>
                                                        {item.product?.title ||
                                                            "-"}
                                                    </Text>
                                                }
                                                description={
                                                    <Space
                                                        direction="vertical"
                                                        size={2}
                                                    >
                                                        <Text type="secondary">
                                                            Masuk {item.qty_in} ·
                                                            Terjual{" "}
                                                            {item.qty_sold ?? 0} ·
                                                            Retur{" "}
                                                            {item.qty_returned ??
                                                                0}
                                                        </Text>
                                                        <Text>
                                                            Sisa{" "}
                                                            <Text strong>
                                                                {item.remaining_qty ??
                                                                    0}
                                                            </Text>{" "}
                                                            @{" "}
                                                            {formatRupiahCompact(
                                                                item.cost_price,
                                                            )}
                                                        </Text>
                                                    </Space>
                                                }
                                            />
                                            <div style={{ textAlign: "right" }}>
                                                <Text
                                                    strong
                                                    style={{
                                                        color: "var(--semantic-success)",
                                                    }}
                                                >
                                                    {formatRupiahCompact(
                                                        item.remaining_value ?? 0,
                                                    )}
                                                </Text>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Table
                                    rowKey="id"
                                    columns={itemColumns}
                                    dataSource={consignment.items || []}
                                    pagination={false}
                                    summary={() => (
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell
                                                index={0}
                                                colSpan={2}
                                            >
                                                <Text strong>Total</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell
                                                index={2}
                                                align="center"
                                            >
                                                <Text strong>
                                                    {totals.total_qty_in ?? 0}
                                                </Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell
                                                index={3}
                                                align="center"
                                            >
                                                {totals.total_qty_sold ?? 0}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell
                                                index={4}
                                                align="center"
                                            >
                                                {totals.total_qty_returned ?? 0}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell
                                                index={5}
                                                align="center"
                                            >
                                                <Text strong>
                                                    {totals.total_remaining_qty ??
                                                        0}
                                                </Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={6} />
                                            <Table.Summary.Cell
                                                index={7}
                                                align="right"
                                            >
                                                <Text
                                                    strong
                                                    style={{
                                                        color: "var(--semantic-success)",
                                                    }}
                                                >
                                                    {formatRupiah(
                                                        totals.total_remaining_value ??
                                                            0,
                                                    )}
                                                </Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    )}
                                />
                            )}
                        </Card>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}