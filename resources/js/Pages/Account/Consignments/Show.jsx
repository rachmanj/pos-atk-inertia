import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
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
    DatePicker,
    Grid,
    Input,
    InputNumber,
    List,
    Modal,
    Row,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    InboxOutlined,
    RollbackOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

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
    const {
        consignment,
        totals = {},
        consignmentReturns = [],
        flash = {},
        errors = {},
    } = usePage().props;
    const loading = useInertiaLoading();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const returnableItems = useMemo(
        () =>
            (consignment.items || []).filter(
                (item) => (item.remaining_qty ?? 0) > 0,
            ),
        [consignment.items],
    );

    const canReturn = returnableItems.length > 0;

    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnDate, setReturnDate] = useState(dayjs());
    const [returnNote, setReturnNote] = useState("");
    const [returnQtyByItem, setReturnQtyByItem] = useState({});

    const openReturnModal = () => {
        const initial = {};
        returnableItems.forEach((item) => {
            initial[item.id] = 0;
        });
        setReturnQtyByItem(initial);
        setReturnDate(dayjs());
        setReturnNote("");
        setReturnModalOpen(true);
    };

    const selectedReturnLines = useMemo(
        () =>
            returnableItems
                .map((item) => ({
                    consignment_item_id: item.id,
                    qty: returnQtyByItem[item.id] ?? 0,
                }))
                .filter((line) => line.qty > 0),
        [returnableItems, returnQtyByItem],
    );

    const submitReturn = () => {
        router.post(
            `/account/consignments/${consignment.id}/returns`,
            {
                return_date: returnDate.format("YYYY-MM-DD"),
                note: returnNote || null,
                items: selectedReturnLines,
            },
            {
                preserveScroll: true,
                onSuccess: () => setReturnModalOpen(false),
            },
        );
    };

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

    const returnHistoryColumns = [
        {
            title: "Invoice",
            dataIndex: "invoice",
            render: (invoice) => (
                <Link
                    href={`/account/supplier-returns/${invoice}`}
                    style={{ color: "var(--brand-primary)" }}
                >
                    <Text strong>{invoice}</Text>
                </Link>
            ),
        },
        {
            title: "Tanggal",
            dataIndex: "return_date",
            responsive: ["sm"],
            render: (value) => formatDateOnly(value),
        },
        {
            title: "Qty",
            dataIndex: "total_qty",
            align: "center",
            width: 72,
        },
        {
            title: "Nilai",
            dataIndex: "total_amount",
            align: "right",
            render: (value) => formatRupiahCompact(value),
        },
        {
            title: "Oleh",
            responsive: ["md"],
            render: (_, row) => row.user?.name || "-",
        },
    ];

    const returnModalColumns = [
        {
            title: "Produk",
            render: (_, item) => (
                <div>
                    <Text strong>{item.product?.title || "-"}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Sisa maks. {item.remaining_qty ?? 0} pcs
                    </Text>
                </div>
            ),
        },
        {
            title: "Qty retur",
            width: 140,
            render: (_, item) => (
                <InputNumber
                    min={0}
                    max={item.remaining_qty ?? 0}
                    value={returnQtyByItem[item.id] ?? 0}
                    style={{ width: "100%" }}
                    onChange={(value) =>
                        setReturnQtyByItem((prev) => ({
                            ...prev,
                            [item.id]: value ?? 0,
                        }))
                    }
                />
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
                            <Space wrap>
                                {canReturn && (
                                    <Button
                                        type="primary"
                                        icon={<RollbackOutlined />}
                                        onClick={openReturnModal}
                                    >
                                        Retur ke Supplier
                                    </Button>
                                )}
                                <Link href="/account/consignments">
                                    <Button icon={<ArrowLeftOutlined />}>
                                        KEMBALI
                                    </Button>
                                </Link>
                            </Space>
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
                        {flash.error && (
                            <Alert
                                type="error"
                                message={flash.error}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        {(errors.items || Object.keys(errors).some((k) => k.startsWith("items."))) && (
                            <Alert
                                type="error"
                                message={
                                    errors.items ||
                                    Object.entries(errors)
                                        .filter(([k]) => k.startsWith("items."))
                                        .map(([, v]) => v)
                                        .join(" ")
                                }
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

                        <Card size="small" title="Riwayat retur konsinyasi">
                            {consignmentReturns.length === 0 ? (
                                <Text type="secondary">
                                    Belum ada retur untuk penerimaan ini.
                                </Text>
                            ) : (
                                <Table
                                    rowKey="id"
                                    size="small"
                                    pagination={false}
                                    columns={returnHistoryColumns}
                                    dataSource={consignmentReturns}
                                />
                            )}
                        </Card>
                    </Card>
                </Spin>

                <Modal
                    title="Retur barang titipan ke supplier"
                    open={returnModalOpen}
                    onCancel={() => setReturnModalOpen(false)}
                    onOk={submitReturn}
                    okText="Simpan retur"
                    okButtonProps={{
                        disabled: selectedReturnLines.length === 0,
                        loading,
                    }}
                    width={640}
                    destroyOnClose
                >
                    <Space
                        direction="vertical"
                        size="middle"
                        style={{ width: "100%" }}
                    >
                        <div>
                            <Text
                                type="secondary"
                                style={{
                                    display: "block",
                                    marginBottom: 4,
                                    fontSize: 12,
                                }}
                            >
                                Tanggal retur
                            </Text>
                            <DatePicker
                                value={returnDate}
                                onChange={(value) =>
                                    setReturnDate(value || dayjs())
                                }
                                format="DD/MM/YYYY"
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div>
                            <Text
                                type="secondary"
                                style={{
                                    display: "block",
                                    marginBottom: 4,
                                    fontSize: 12,
                                }}
                            >
                                Catatan (opsional)
                            </Text>
                            <Input.TextArea
                                rows={2}
                                value={returnNote}
                                onChange={(e) => setReturnNote(e.target.value)}
                                maxLength={1000}
                                placeholder="Alasan atau catatan retur"
                            />
                        </div>
                        <Table
                            rowKey="id"
                            size="small"
                            pagination={false}
                            columns={returnModalColumns}
                            dataSource={returnableItems}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Pilih minimal satu baris dengan qty retur &gt; 0.
                            Stok fisik akan berkurang; utang konsinyasi tidak
                            berubah.
                        </Text>
                    </Space>
                </Modal>
            </LayoutAccount>
        </>
    );
}