import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Form,
    InputNumber,
    Row,
    Space,
    Statistic,
    Tag,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DollarOutlined,
    FallOutlined,
    MoneyCollectOutlined,
    RiseOutlined,
    ShoppingCartOutlined,
    SwapOutlined,
    WalletOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const dateTimeFormatOptions = {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
};

export default function CashierShiftShow() {
    const { shift, flash, errors, auth } = usePage().props;
    const permissions = auth?.permissions || {};

    const [actualCash, setActualCash] = useState(
        shift.status === "open" ? shift.summary?.expected_cash || 0 : shift.actual_cash,
    );
    const [note, setNote] = useState("");

    const estimatedDifference = useMemo(() => {
        const value = Number(actualCash || 0) - Number(shift.summary?.expected_cash || 0);
        return Number.isNaN(value) ? 0 : value;
    }, [actualCash, shift.summary?.expected_cash]);

    const closeShift = (e) => {
        e.preventDefault();
        router.put(`/account/cashier-shifts/${shift.id}/close`, { actual_cash: actualCash, note });
    };

    return (
        <>
            <Head><title>Detail Shift - ZenPOS</title></Head>
            <LayoutAccount>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
                        <Space>
                            <ClockCircleOutlined style={{ color: "#0d9488", fontSize: 20 }} />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>DETAIL SHIFT #{shift.id}</Title>
                                <Text type="secondary">
                                    {shift.status === "open" ? "Shift sedang berjalan" : "Shift sudah ditutup"}
                                </Text>
                            </div>
                        </Space>
                        <Link href="/account/cashier-shifts">
                            <Button icon={<ArrowLeftOutlined />}>KEMBALI</Button>
                        </Link>
                    </Space>

                    {flash.success && <Alert type="success" message={flash.success} showIcon />}
                    {flash.error && <Alert type="error" message={flash.error} showIcon />}

                    <Card>
                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={12} md={6}>
                                <Statistic title="Kasir" value={shift.user?.name || "-"} prefix={<ClockCircleOutlined />} />
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Statistic
                                    title="Waktu Buka"
                                    value={shift.opened_at ? new Date(shift.opened_at).toLocaleString("id-ID", dateTimeFormatOptions) : "-"}
                                    valueStyle={{ fontSize: 14 }}
                                />
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Statistic
                                    title="Waktu Tutup"
                                    value={shift.closed_at ? new Date(shift.closed_at).toLocaleString("id-ID", dateTimeFormatOptions) : "-"}
                                    valueStyle={{ fontSize: 14 }}
                                />
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <div style={{ textAlign: "center" }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Status</Text>
                                    <Tag color={shift.status === "open" ? "success" : "default"} style={{ fontSize: 13, padding: "2px 12px" }}>
                                        {shift.status === "open" ? "BUKA" : "TUTUP"}
                                    </Tag>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    <Card title={<Space><DollarOutlined style={{ color: "#0d9488" }} />Ringkasan Keuangan</Space>}>
                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Kas Awal" value={shift.cash_in_hand} prefix={<MoneyCollectOutlined />} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Penjualan Tunai" value={shift.summary?.cash_sales || 0} prefix={<RiseOutlined />} valueStyle={{ color: "#22c55e" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Non Tunai" value={shift.summary?.non_cash_sales || 0} prefix={<WalletOutlined />} valueStyle={{ color: "#3b82f6" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Kas Seharusnya" value={shift.summary?.expected_cash || 0} prefix={<DollarOutlined />} valueStyle={{ color: "#0d9488" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Refund Tunai" value={shift.summary?.cash_refunds || 0} prefix={<FallOutlined />} valueStyle={{ color: "#ef4444" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Refund Non Tunai" value={shift.summary?.non_cash_refunds || 0} prefix={<SwapOutlined />} valueStyle={{ color: "#f59e0b" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Transaksi" value={shift.summary?.total_transactions || 0} prefix={<ShoppingCartOutlined />} suffix={<Text type="secondary" style={{ fontSize: 12 }}>Lunas: {shift.summary?.paid_transactions || 0}</Text>} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Retur Disetujui" value={shift.summary?.total_returns || 0} prefix={<CheckCircleOutlined />} /></Card>
                            </Col>
                        </Row>
                    </Card>

                    {shift.summary?.ppob_expected_balance != null && (
                        <Card
                            title="Ringkasan PPOB Shift"
                            style={{ background: "linear-gradient(135deg, #0d9488, #115e59)" }}
                            headStyle={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
                        >
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Saldo Awal" value={shift.summary.ppob_opening_balance || shift.ppob_opening_balance || 0} formatter={v => formatRupiah(v)} />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Top Up" value={shift.summary.ppob_top_ups || 0} formatter={v => formatRupiah(v)} valueStyle={{ color: "#22c55e" }} />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Biaya Penjualan" value={shift.summary.ppob_sales_cost || 0} formatter={v => formatRupiah(v)} valueStyle={{ color: "#ef4444" }} />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Kontribusi Shift" value={shift.summary.ppob_expected_balance || 0} formatter={v => formatRupiah(v)} valueStyle={{ color: "#fff" }} />
                                </Col>
                            </Row>
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginTop: 16 }}
                                message="Akun PPOB dapat dipakai bersamaan oleh kasir lain. Saldo di atas hanya kontribusi shift ini. Verifikasi di menu Riwayat Saldo PPOB."
                            />
                        </Card>
                    )}

                    {shift.note && (
                        <Card title="Catatan Shift" size="small">
                            <Text style={{ whiteSpace: "pre-line" }}>{shift.note}</Text>
                        </Card>
                    )}

                    {shift.status === "open" && hasAnyPermission(["cashier_shifts.close"], permissions) ? (
                        <Card
                            title={<Space><CloseCircleOutlined style={{ color: "#ef4444" }} />TUTUP SHIFT</Space>}
                            style={{ borderColor: "#ef4444" }}
                        >
                            <Form layout="vertical" onFinish={closeShift}>
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Kas Aktual"
                                            validateStatus={errors.actual_cash ? "error" : ""}
                                            help={errors.actual_cash}
                                        >
                                            <InputNumber
                                                min={0}
                                                style={{ width: "100%" }}
                                                value={actualCash}
                                                onChange={v => setActualCash(v || 0)}
                                                formatter={v => formatRupiah(v)}
                                                parser={v => v?.replace(/\D/g, "")}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Kas Seharusnya">
                                            <InputNumber style={{ width: "100%" }} value={shift.summary?.expected_cash || 0} disabled formatter={v => formatRupiah(v)} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Perkiraan Selisih">
                                            <InputNumber
                                                style={{ width: "100%", color: estimatedDifference < 0 ? "#ef4444" : "#22c55e" }}
                                                value={estimatedDifference}
                                                disabled
                                                formatter={v => formatRupiah(v)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item label="Catatan Penutupan" validateStatus={errors.note ? "error" : ""} help={errors.note}>
                                            <Input.TextArea rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="Contoh: ada selisih kas karena pembulatan atau koreksi manual." />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Button type="primary" danger size="large" htmlType="submit" icon={<CloseCircleOutlined />}>
                                    TUTUP SHIFT
                                </Button>
                            </Form>
                        </Card>
                    ) : shift.status === "closed" ? (
                        <Card title="Hasil Penutupan">
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={8}>
                                    <Statistic title="Kas Aktual" value={shift.actual_cash} formatter={v => formatRupiah(v)} prefix={<MoneyCollectOutlined />} />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic title="Selisih" value={shift.difference} formatter={v => formatRupiah(v)} valueStyle={{ color: shift.difference < 0 ? "#ef4444" : "#22c55e" }} prefix={<SwapOutlined />} />
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Statistic title="Total Transaksi" value={shift.total_transactions} prefix={<ShoppingCartOutlined />} />
                                </Col>
                            </Row>
                        </Card>
                    ) : null}
                </Space>
            </LayoutAccount>
        </>
    );
}
