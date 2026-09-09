import React, { useCallback, useEffect, useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND } from "../../../theme/colors";
import axios from "axios";
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    List,
    Modal,
    Row,
    Space,
    Spin,
    Statistic,
    Tag,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DollarOutlined,
    EyeOutlined,
    FallOutlined,
    MoneyCollectOutlined,
    RedoOutlined,
    RiseOutlined,
    SendOutlined,
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

const waStatusLabels = {
    queued: "Antrian",
    sent: "Terkirim",
    failed: "Gagal",
};

const waStatusColors = {
    queued: "processing",
    sent: "success",
    failed: "error",
};

function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
}

export default function CashierShiftShow() {
    const { shift, flash, errors, auth, canSendWaReport = false, whatsappLogs = [] } = usePage().props;
    const permissions = auth?.permissions || {};
    const loading = useInertiaLoading();

    const [actualCash, setActualCash] = useState(
        shift.status === "open" ? shift.summary?.expected_cash || 0 : shift.actual_cash,
    );
    const [note, setNote] = useState("");

    const [waModalOpen, setWaModalOpen] = useState(false);
    const [expenseAmount, setExpenseAmount] = useState(0);
    const [expenseNote, setExpenseNote] = useState("");
    const [previewText, setPreviewText] = useState("");
    const [previewOk, setPreviewOk] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [viewMessageLog, setViewMessageLog] = useState(null);

    const estimatedDifference = useMemo(() => {
        const value = Number(actualCash || 0) - Number(shift.summary?.expected_cash || 0);
        return Number.isNaN(value) ? 0 : value;
    }, [actualCash, shift.summary?.expected_cash]);

    const loadPreview = useCallback(async () => {
        setPreviewLoading(true);
        setPreviewOk(false);

        try {
            const response = await axios.post(
                `/account/cashier-shifts/${shift.id}/wa-report/preview`,
                {
                    expense_amount: expenseAmount || 0,
                    expense_note: expenseNote || null,
                },
                { headers: { "X-CSRF-TOKEN": getCsrfToken() } },
            );

            if (response.data?.ok) {
                setPreviewText(response.data.text || "");
                setPreviewOk(true);
            } else {
                setPreviewText("");
                notification.error({
                    message: "Pratinjau gagal",
                    description: response.data?.message || "Tidak dapat memuat pratinjau rekap shift.",
                });
            }
        } catch (error) {
            setPreviewText("");
            notification.error({
                message: "Pratinjau gagal",
                description: error.response?.data?.message || "Tidak dapat memuat pratinjau rekap shift.",
            });
        } finally {
            setPreviewLoading(false);
        }
    }, [shift.id, expenseAmount, expenseNote]);

    const openWaModal = () => {
        setExpenseAmount(0);
        setExpenseNote("");
        setPreviewText("");
        setPreviewOk(false);
        setWaModalOpen(true);
    };

    useEffect(() => {
        if (waModalOpen) {
            loadPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waModalOpen]);

    const sendWaReport = async () => {
        if (!previewOk) {
            return;
        }

        setSendLoading(true);

        try {
            const response = await axios.post(
                `/account/cashier-shifts/${shift.id}/wa-report/send`,
                {
                    expense_amount: expenseAmount || 0,
                    expense_note: expenseNote || null,
                },
                { headers: { "X-CSRF-TOKEN": getCsrfToken() } },
            );

            if (response.data?.ok) {
                notification.success({
                    message: "Berhasil",
                    description: "Rekap shift berhasil dikirim ke WhatsApp admin.",
                });
                setWaModalOpen(false);
                router.reload({ only: ["whatsappLogs"] });
            } else {
                notification.error({
                    message: "Gagal mengirim",
                    description: response.data?.message || "Pengiriman rekap shift gagal.",
                });
            }
        } catch (error) {
            notification.error({
                message: "Gagal mengirim",
                description: error.response?.data?.message || "Pengiriman rekap shift gagal.",
            });
        } finally {
            setSendLoading(false);
        }
    };

    const closeShift = () => {
        router.put(
            `/account/cashier-shifts/${shift.id}/close`,
            { actual_cash: actualCash, note },
            {
                onError: () => {
                    notification.error({
                        message: "Gagal",
                        description:
                            "Penutupan shift gagal. Periksa data dan coba lagi.",
                    });
                },
            },
        );
    };

    return (
        <>
            <Head><title>Detail Shift - VASIA Stationery</title></Head>
            <LayoutAccount>
                <Spin spinning={loading}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
                        <Space>
                            <ClockCircleOutlined style={{ color: "var(--brand-primary)", fontSize: 20 }} />
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

                    <Card title={<Space><DollarOutlined style={{ color: "var(--brand-primary)" }} />Ringkasan Keuangan</Space>}>
                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Kas Awal" value={shift.cash_in_hand} prefix={<MoneyCollectOutlined />} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Penjualan Tunai" value={shift.summary?.cash_sales || 0} prefix={<RiseOutlined />} valueStyle={{ color: "var(--semantic-success)" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Non Tunai" value={shift.summary?.non_cash_sales || 0} prefix={<WalletOutlined />} valueStyle={{ color: "var(--semantic-info)" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Kas Seharusnya" value={shift.summary?.expected_cash || 0} prefix={<DollarOutlined />} valueStyle={{ color: "var(--brand-primary)" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Refund Tunai" value={shift.summary?.cash_refunds || 0} prefix={<FallOutlined />} valueStyle={{ color: "var(--semantic-error)" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Refund Non Tunai" value={shift.summary?.non_cash_refunds || 0} prefix={<SwapOutlined />} valueStyle={{ color: "var(--semantic-warning)" }} formatter={v => formatRupiah(v)} /></Card>
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
                            style={{ background: `linear-gradient(135deg, ${BRAND.primary}, #115e59)` }}
                            headStyle={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
                        >
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Saldo Awal" value={shift.summary.ppob_opening_balance || shift.ppob_opening_balance || 0} formatter={v => formatRupiah(v)} />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Top Up" value={shift.summary.ppob_top_ups || 0} formatter={v => formatRupiah(v)} valueStyle={{ color: "var(--semantic-success)" }} />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Biaya Penjualan" value={shift.summary.ppob_sales_cost || 0} formatter={v => formatRupiah(v)} valueStyle={{ color: "var(--semantic-error)" }} />
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
                            title={<Space><CloseCircleOutlined style={{ color: "var(--semantic-error)" }} />TUTUP SHIFT</Space>}
                            style={{ borderColor: "var(--semantic-error)" }}
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
                                                style={{ width: "100%", color: estimatedDifference < 0 ? "var(--semantic-error)" : "var(--semantic-success)" }}
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
                        <>
                            <Card title="Hasil Penutupan">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={8}>
                                        <Statistic title="Kas Aktual" value={shift.actual_cash} formatter={v => formatRupiah(v)} prefix={<MoneyCollectOutlined />} />
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Statistic title="Selisih" value={shift.difference} formatter={v => formatRupiah(v)} valueStyle={{ color: shift.difference < 0 ? "var(--semantic-error)" : "var(--semantic-success)" }} prefix={<SwapOutlined />} />
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Statistic title="Total Transaksi" value={shift.total_transactions} prefix={<ShoppingCartOutlined />} />
                                    </Col>
                                </Row>
                            </Card>

                            {canSendWaReport && (
                                <Card title="Kirim Rekap ke WhatsApp">
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        <Text type="secondary">
                                            Kirim ringkasan penjualan shift ini ke nomor admin WhatsApp.
                                        </Text>
                                        <Button type="primary" icon={<SendOutlined />} onClick={openWaModal}>
                                            Kirim Rekap Shift ke WA
                                        </Button>
                                    </Space>
                                </Card>
                            )}

                            <Card title="Riwayat Kiriman">
                                {whatsappLogs.length === 0 ? (
                                    <Text type="secondary">Belum ada riwayat pengiriman rekap shift.</Text>
                                ) : (
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={whatsappLogs}
                                        renderItem={log => (
                                            <List.Item
                                                actions={[
                                                    <Button
                                                        key="view"
                                                        size="small"
                                                        icon={<EyeOutlined />}
                                                        onClick={() => setViewMessageLog(log)}
                                                    >
                                                        Lihat Pesan
                                                    </Button>,
                                                    canSendWaReport ? (
                                                        <Button
                                                            key="resend"
                                                            size="small"
                                                            icon={<RedoOutlined />}
                                                            onClick={openWaModal}
                                                        >
                                                            Kirim Ulang
                                                        </Button>
                                                    ) : null,
                                                ].filter(Boolean)}
                                            >
                                                <List.Item.Meta
                                                    title={(
                                                        <Space wrap>
                                                            <Text>
                                                                {log.created_at
                                                                    ? new Date(log.created_at).toLocaleString("id-ID", dateTimeFormatOptions)
                                                                    : "-"}
                                                            </Text>
                                                            <Tag color={waStatusColors[log.status] || "default"}>
                                                                {waStatusLabels[log.status] || log.status}
                                                            </Tag>
                                                        </Space>
                                                    )}
                                                    description={(
                                                        <Text type="secondary">
                                                            Pengirim: {log.created_by?.name || "-"}
                                                            {log.error ? ` · ${log.error}` : ""}
                                                        </Text>
                                                    )}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </Card>
                        </>
                    ) : null}
                </Space>
                </Spin>

                <Modal
                    title="Kirim Rekap Shift ke WhatsApp"
                    open={waModalOpen}
                    onCancel={() => setWaModalOpen(false)}
                    footer={null}
                    width={640}
                    destroyOnClose
                >
                    <Form layout="vertical">
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item label="Pengeluaran Lain">
                                    <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        value={expenseAmount}
                                        onChange={v => setExpenseAmount(v || 0)}
                                        placeholder="0 (opsional)"
                                        formatter={v => formatRupiah(v)}
                                        parser={v => v?.replace(/\D/g, "")}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item label="Catatan Pengeluaran">
                                    <Input
                                        value={expenseNote}
                                        onChange={e => setExpenseNote(e.target.value)}
                                        placeholder="Opsional"
                                        maxLength={255}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Space style={{ marginBottom: 16 }}>
                            <Button loading={previewLoading} onClick={loadPreview}>
                                Pratinjau
                            </Button>
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                loading={sendLoading}
                                disabled={!previewOk || previewLoading}
                                onClick={sendWaReport}
                            >
                                Kirim ke WA
                            </Button>
                        </Space>
                        <Form.Item label="Pratinjau Pesan">
                            <pre
                                style={{
                                    margin: 0,
                                    padding: 12,
                                    maxHeight: 320,
                                    overflow: "auto",
                                    background: "var(--surface-elevated, #f5f5f5)",
                                    border: "1px solid var(--border-subtle, #d9d9d9)",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    lineHeight: 1.5,
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                }}
                            >
                                {previewLoading ? "Memuat pratinjau..." : (previewText || "Klik Pratinjau untuk melihat isi pesan.")}
                            </pre>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="Isi Pesan"
                    open={!!viewMessageLog}
                    onCancel={() => setViewMessageLog(null)}
                    footer={[
                        <Button key="close" onClick={() => setViewMessageLog(null)}>
                            Tutup
                        </Button>,
                    ]}
                    width={640}
                >
                    <pre
                        style={{
                            margin: 0,
                            padding: 12,
                            maxHeight: 420,
                            overflow: "auto",
                            background: "var(--surface-elevated, #f5f5f5)",
                            border: "1px solid var(--border-subtle, #d9d9d9)",
                            borderRadius: 6,
                            fontSize: 12,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        }}
                    >
                        {viewMessageLog?.message_text || ""}
                    </pre>
                </Modal>
            </LayoutAccount>
        </>
    );
}
