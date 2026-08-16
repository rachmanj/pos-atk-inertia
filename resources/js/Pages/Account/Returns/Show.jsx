import LayoutAccount from "../../../Layouts/Account";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import hasAnyPermission from "../../../Utils/Permissions";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, SEMANTIC } from "../../../theme/colors";
import {
    Button,
    Card,
    Col,
    Modal,
    Row,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    CheckOutlined,
    CloseOutlined,
    UndoOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const statusLabels = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
};

const statusColors = {
    pending: "warning",
    approved: "success",
    rejected: "error",
};

const reasonLabels = {
    defect: "Barang Rusak",
    wrong_item: "Salah Barang",
    customer_request: "Permintaan Customer",
    other: "Lainnya",
};

const refundMethodLabels = {
    cash: "Tunai",
    original: "Metode Awal",
};

const paymentMethodLabels = {
    cash: "Tunai",
    digital: "Digital",
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

export default function Show() {
    const { return: returnData, flash = {}, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();
    const details = returnData.details || [];

    const canApproveReturn =
        hasAnyPermission(["returns.approve"], permissions) &&
        returnData.status === "pending";

    const formatDate = (date) =>
        new Date(date).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });

    const handleUpdateStatus = (status) => {
        const isApproved = status === "approved";

        Modal.confirm({
            title: isApproved ? "Setujui retur?" : "Tolak retur?",
            content: isApproved
                ? "Retur yang disetujui akan memproses stok dan penyesuaian profit."
                : "Retur ini akan ditandai sebagai ditolak.",
            okText: isApproved ? "Ya, setujui" : "Ya, tolak",
            cancelText: "Batal",
            okType: isApproved ? "primary" : "danger",
            onOk: () => {
                router.put(`/account/returns/${returnData.id}`, { status });
            },
        });
    };

    useEffect(() => {
        if (flash.success) {
            notification.success({
                message: "Berhasil",
                description: flash.success,
                duration: 2,
            });
        }
        if (flash.error) {
            notification.error({
                message: "Gagal",
                description: flash.error,
            });
        }
    }, [flash]);

    const columns = [
        {
            title: "No.",
            width: 50,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Produk",
            render: (_, detail) => (
                <Text strong>{detail.product?.title || "-"}</Text>
            ),
        },
        {
            title: "Qty Retur",
            align: "center",
            dataIndex: "qty",
        },
        {
            title: "Harga",
            align: "right",
            dataIndex: "price",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Subtotal Refund",
            align: "right",
            dataIndex: "subtotal",
            render: (value) => (
                <Text strong style={{ color: SEMANTIC.success }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
        {
            title: "Restock",
            align: "center",
            dataIndex: "restock",
            render: (value) => (
                <Tag color={value ? "success" : "default"}>
                    {value ? "Ya" : "Tidak"}
                </Tag>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>{`Retur ${returnData.invoice} - VASIA Stationery`}</title>
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
                                <UndoOutlined
                                    style={{ fontSize: 20, color: BRAND.primary }}
                                />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        DETAIL RETUR
                                    </Title>
                                    <Text type="secondary">
                                        Invoice Retur: {returnData.invoice}
                                    </Text>
                                </div>
                            </Space>
                            <Space wrap>
                                <Link href="/account/returns">
                                    <Button icon={<ArrowLeftOutlined />}>
                                        Kembali
                                    </Button>
                                </Link>
                                {canApproveReturn && (
                                    <>
                                        <Button
                                            type="primary"
                                            icon={<CheckOutlined />}
                                            onClick={() =>
                                                handleUpdateStatus("approved")
                                            }
                                        >
                                            Setujui
                                        </Button>
                                        <Button
                                            danger
                                            icon={<CloseOutlined />}
                                            onClick={() =>
                                                handleUpdateStatus("rejected")
                                            }
                                        >
                                            Tolak
                                        </Button>
                                    </>
                                )}
                            </Space>
                        </Space>

                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={6}>
                                <InfoCard label="Invoice Retur">
                                    <Text strong>{returnData.invoice}</Text>
                                </InfoCard>
                            </Col>
                            <Col xs={12} sm={6}>
                                <InfoCard label="Status Retur">
                                    <Tag
                                        color={
                                            statusColors[returnData.status] ||
                                            "default"
                                        }
                                    >
                                        {statusLabels[returnData.status] || "-"}
                                    </Tag>
                                </InfoCard>
                            </Col>
                            <Col xs={12} sm={6}>
                                <InfoCard label="Total Refund">
                                    <Text
                                        strong
                                        style={{ color: SEMANTIC.success }}
                                    >
                                        {formatRupiah(returnData.total_refund)}
                                    </Text>
                                </InfoCard>
                            </Col>
                            <Col xs={12} sm={6}>
                                <InfoCard label="Metode Refund">
                                    <Text strong>
                                        {refundMethodLabels[
                                            returnData.refund_method
                                        ] || "-"}
                                    </Text>
                                </InfoCard>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Card
                                    title="Informasi Transaksi"
                                    size="small"
                                    style={{ height: "100%" }}
                                >
                                    <Space
                                        direction="vertical"
                                        size="middle"
                                        style={{ width: "100%" }}
                                    >
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Invoice Transaksi
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {returnData.transaction?.invoice}
                                            </Text>
                                        </div>
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Customer
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {returnData.transaction?.customer
                                                    ?.name || "Umum"}
                                            </Text>
                                        </div>
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Kasir Transaksi
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {returnData.transaction?.cashier
                                                    ?.name || "-"}
                                            </Text>
                                        </div>
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Metode Pembayaran
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {paymentMethodLabels[
                                                    returnData.transaction
                                                        ?.payment_method
                                                ] || "-"}
                                            </Text>
                                        </div>
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Total Transaksi
                                            </Text>
                                            <br />
                                            <Text
                                                strong
                                                style={{ color: SEMANTIC.success }}
                                            >
                                                {formatRupiah(
                                                    returnData.transaction
                                                        ?.grand_total,
                                                )}
                                            </Text>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card
                                    title="Informasi Retur"
                                    size="small"
                                    style={{ height: "100%" }}
                                >
                                    <Space
                                        direction="vertical"
                                        size="middle"
                                        style={{ width: "100%" }}
                                    >
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Tanggal Pengajuan
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {formatDate(returnData.created_at)}
                                            </Text>
                                        </div>
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Diajukan Oleh
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {returnData.cashier?.name || "-"}
                                            </Text>
                                        </div>
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Alasan Retur
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {reasonLabels[returnData.reason] ||
                                                    "-"}
                                            </Text>
                                        </div>
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                Catatan
                                            </Text>
                                            <br />
                                            <Text strong>
                                                {returnData.note || "-"}
                                            </Text>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>

                        <Card title="Item Retur">
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={details}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                summary={() => (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell
                                            index={0}
                                            colSpan={4}
                                            align="end"
                                        >
                                            <Text strong>Total Refund</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text
                                                strong
                                                style={{ color: SEMANTIC.success }}
                                            >
                                                {formatRupiah(
                                                    returnData.total_refund,
                                                )}
                                            </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} />
                                    </Table.Summary.Row>
                                )}
                                locale={{
                                    emptyText:
                                        "Belum ada item retur pada pengajuan ini.",
                                }}
                            />
                        </Card>
                    </Space>
                </Spin>
            </LayoutAccount>
        </>
    );
}
