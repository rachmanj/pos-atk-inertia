import React, { useCallback, useEffect, useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
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
    Table,
    Tag,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    DollarOutlined,
    EyeOutlined,
    FallOutlined,
    MoneyCollectOutlined,
    PlusOutlined,
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

const createEmptyExpenseLine = () => ({
    title: "",
    amount: 0,
});

const buildExpenseLinesFromShift = (shift) => {
    const expenses = shift?.expenses ?? [];
    if (expenses.length > 0) {
        return expenses.map(({ title, amount }) => ({
            title: title ?? "",
            amount: Number(amount) || 0,
        }));
    }
    return [createEmptyExpenseLine()];
};

const validateAndBuildExpensePayload = (lines) => {
    const hasMissingTitle = lines.some(
        (line) => Number(line.amount || 0) >= 1 && !String(line.title || "").trim(),
    );
    if (hasMissingTitle) {
        notification.error({
            message: "Validasi gagal",
            description: "Keterangan wajib diisi untuk setiap baris pengeluaran",
        });
        return null;
    }

    const expenses = lines
        .filter(
            (line) => Number(line.amount || 0) >= 1 && String(line.title || "").trim(),
        )
        .map((line) => ({
            title: String(line.title).trim(),
            amount: Number(line.amount),
        }));

    const expense_amount = expenses.reduce((sum, line) => sum + line.amount, 0);

    return { expenses, expense_amount };
};

const readCsrfToken = () => {
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    if (match) {
        try {
            return decodeURIComponent(match.split("=")[1]);
        } catch {
            // fallthrough ke meta
        }
    }
    return (
        document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ||
        ""
    );
};

export default function CashierShiftShow() {
    const { shift, flash, errors, auth, canSendWaReport = false, whatsappLogs = [] } = usePage().props;
    const permissions = auth?.permissions || {};
    const loading = useInertiaLoading();

    const [actualCash, setActualCash] = useState(
        shift.status === "open" ? shift.summary?.expected_cash || 0 : shift.actual_cash,
    );
    const [cashOverage, setCashOverage] = useState(0);
    const [overageNote, setOverageNote] = useState("");
    const [note, setNote] = useState("");

    const [waModalOpen, setWaModalOpen] = useState(false);
    const [expenseLines, setExpenseLines] = useState(() => buildExpenseLinesFromShift(shift));
    const [previewText, setPreviewText] = useState("");
    const [previewOk, setPreviewOk] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [viewMessageLog, setViewMessageLog] = useState(null);

    const physicalCash = useMemo(() => {
        const value = Number(actualCash || 0) + Number(cashOverage || 0);
        return Number.isNaN(value) ? 0 : value;
    }, [actualCash, cashOverage]);

    const estimatedDifference = useMemo(() => {
        const value = physicalCash - Number(shift.summary?.expected_cash || 0);
        return Number.isNaN(value) ? 0 : value;
    }, [physicalCash, shift.summary?.expected_cash]);

    const countedCash = useMemo(() => {
        if (shift.status !== "closed" || !shift.cash_overage) {
            return shift.actual_cash;
        }
        return Number(shift.actual_cash || 0) - Number(shift.cash_overage || 0);
    }, [shift.status, shift.actual_cash, shift.cash_overage]);

    const totalExpenseAmount = useMemo(
        () =>
            expenseLines.reduce(
                (sum, line) => sum + Number(line.amount || 0),
                0,
            ),
        [expenseLines],
    );

    const updateExpenseLine = (index, field, value) => {
        setExpenseLines((lines) =>
            lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line,
            ),
        );
    };

    const addExpenseLine = () => {
        setExpenseLines((lines) => [...lines, createEmptyExpenseLine()]);
    };

    const removeExpenseLine = (index) => {
        setExpenseLines((lines) => {
            if (lines.length === 1) {
                return lines;
            }
            return lines.filter((_, lineIndex) => lineIndex !== index);
        });
    };

    const expenseLineColumns = [
        {
            title: "Keterangan",
            render: (_, line, index) => (
                <Input
                    value={line.title}
                    maxLength={150}
                    placeholder="Beli bensin"
                    onChange={(e) => updateExpenseLine(index, "title", e.target.value)}
                />
            ),
        },
        {
            title: "Nominal",
            align: "right",
            width: 160,
            render: (_, line, index) => (
                <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    value={line.amount}
                    onChange={(value) => updateExpenseLine(index, "amount", value ?? 0)}
                    formatter={(v) => formatRupiah(v)}
                    parser={(v) => v?.replace(/\D/g, "")}
                />
            ),
        },
        {
            title: "Aksi",
            align: "center",
            width: 70,
            render: (_, __, index) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeExpenseLine(index)}
                    disabled={expenseLines.length === 1}
                />
            ),
        },
    ];

    const loadPreview = useCallback(async () => {
        const payload = validateAndBuildExpensePayload(expenseLines);
        if (payload === null) {
            setPreviewText("");
            setPreviewOk(false);
            return;
        }

        setPreviewLoading(true);
        setPreviewOk(false);

        try {
            const response = await axios.post(
                `/account/cashier-shifts/${shift.id}/report/preview`,
                payload,
                { headers: { "X-XSRF-TOKEN": readCsrfToken() } },
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
    }, [shift.id, expenseLines]);

    const openWaModal = () => {
        setExpenseLines(buildExpenseLinesFromShift(shift));
        setPreviewText("");
        setPreviewOk(false);
        setWaModalOpen(true);
    };

    useEffect(() => {
        if (waModalOpen) {
            loadPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waModalOpen, shift.id]);

    const sendWaReport = async () => {
        if (!previewOk) {
            return;
        }

        const payload = validateAndBuildExpensePayload(expenseLines);
        if (payload === null) {
            return;
        }

        setSendLoading(true);

        try {
            const response = await axios.post(
                `/account/cashier-shifts/${shift.id}/report/send`,
                payload,
                { headers: { "X-XSRF-TOKEN": readCsrfToken() } },
            );

            if (response.data?.ok) {
                notification.success({
                    message: "Berhasil",
                    description: "Rekap shift berhasil dikirim ke Telegram admin.",
                });
                setWaModalOpen(false);
                router.reload({ only: ["whatsappLogs", "shift"] });
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
            {
                actual_cash: actualCash,
                cash_overage: cashOverage || 0,
                overage_note: cashOverage > 0 ? overageNote : null,
                note,
            },
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
                                <Card size="small"><Statistic title="Pengeluaran dari Laci" value={shift.summary?.expense_amount || 0} prefix={<FallOutlined />} valueStyle={{ color: "var(--semantic-warning)" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small"><Statistic title="Kas Seharusnya" value={shift.summary?.kas_seharusnya ?? shift.summary?.expected_cash ?? 0} prefix={<DollarOutlined />} valueStyle={{ color: "var(--brand-primary)" }} formatter={v => formatRupiah(v)} /></Card>
                            </Col>
                            <Col xs={12} sm={12} md={6}>
                                <Card size="small">
                                    {shift.summary?.shift_open ? (
                                        <Statistic
                                            title="Selisih Kas"
                                            value="Belum ditutup"
                                            prefix={<SwapOutlined />}
                                            valueStyle={{
                                                color: "var(--text-secondary)",
                                                fontSize: 14,
                                            }}
                                        />
                                    ) : (
                                        <Statistic
                                            title={
                                                Number(shift.summary?.selisih ?? 0) < 0
                                                    ? "Kekurangan"
                                                    : "Kelebihan"
                                            }
                                            value={shift.summary?.selisih ?? 0}
                                            prefix={<SwapOutlined />}
                                            valueStyle={{
                                                color:
                                                    Number(shift.summary?.selisih ?? 0) < 0
                                                        ? "var(--semantic-error)"
                                                        : Number(shift.summary?.selisih ?? 0) > 0
                                                          ? "var(--semantic-warning)"
                                                          : "var(--semantic-success)",
                                            }}
                                            formatter={(v) => formatRupiah(v)}
                                        />
                                    )}
                                </Card>
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
                            className="ppob-hero-card"
                            title="Ringkasan PPOB Shift"
                        >
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Saldo Awal" value={shift.summary.ppob_opening_balance || shift.ppob_opening_balance || 0} formatter={v => formatRupiah(v)} />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Top Up" className="ppob-hero-positive" value={shift.summary.ppob_top_ups || 0} formatter={v => formatRupiah(v)} />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Biaya Penjualan" className="ppob-hero-negative" value={shift.summary.ppob_sales_cost || 0} formatter={v => formatRupiah(v)} />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic title="Kontribusi Shift" value={shift.summary.ppob_expected_balance || 0} formatter={v => formatRupiah(v)} />
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
                                        <Form.Item
                                            label="Kelebihan Uang (Rp)"
                                            validateStatus={errors.cash_overage ? "error" : ""}
                                            help={errors.cash_overage}
                                        >
                                            <InputNumber
                                                min={0}
                                                style={{ width: "100%" }}
                                                value={cashOverage}
                                                onChange={v => {
                                                    const next = v || 0;
                                                    setCashOverage(next);
                                                    if (next === 0) {
                                                        setOverageNote("");
                                                    }
                                                }}
                                                formatter={v => formatRupiah(v)}
                                                parser={v => v?.replace(/\D/g, "")}
                                            />
                                        </Form.Item>
                                    </Col>
                                    {cashOverage > 0 && (
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Keterangan Kelebihan"
                                                required
                                                validateStatus={errors.overage_note ? "error" : ""}
                                                help={errors.overage_note}
                                            >
                                                <Input
                                                    value={overageNote}
                                                    onChange={e => setOverageNote(e.target.value)}
                                                    placeholder="Contoh: uang kembalian pelanggan tertinggal"
                                                    maxLength={255}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Total Fisik Kas">
                                            <InputNumber
                                                style={{ width: "100%" }}
                                                value={physicalCash}
                                                disabled
                                                formatter={v => formatRupiah(v)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Perkiraan Selisih">
                                            <InputNumber
                                                style={{ width: "100%", color: estimatedDifference < 0 ? "var(--semantic-error)" : estimatedDifference > 0 ? "var(--semantic-warning)" : "var(--semantic-success)" }}
                                                value={estimatedDifference}
                                                disabled
                                                formatter={v => formatRupiah(v)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Alert
                                            type="info"
                                            showIcon
                                            message={`Kas Aktual + Kelebihan = ${formatRupiah(physicalCash)} (Total Fisik Kas)`}
                                            description={`Selisih terhadap kas seharusnya: ${formatRupiah(estimatedDifference)}`}
                                        />
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
                                        <Statistic
                                            title={shift.cash_overage > 0 ? "Kas Aktual (Dihitung)" : "Kas Aktual"}
                                            value={countedCash}
                                            formatter={v => formatRupiah(v)}
                                            prefix={<MoneyCollectOutlined />}
                                        />
                                    </Col>
                                    {shift.cash_overage > 0 && (
                                        <Col xs={24} sm={8}>
                                            <Statistic
                                                title="Kelebihan Uang"
                                                value={shift.cash_overage}
                                                formatter={v => formatRupiah(v)}
                                                valueStyle={{ color: "var(--semantic-warning)" }}
                                                prefix={<RiseOutlined />}
                                            />
                                            {shift.overage_note && (
                                                <Text type="secondary" style={{ display: "block", marginTop: 4, fontSize: 12 }}>
                                                    {shift.overage_note}
                                                </Text>
                                            )}
                                        </Col>
                                    )}
                                    {shift.cash_overage > 0 && (
                                        <Col xs={24} sm={8}>
                                            <Statistic
                                                title="Total Fisik Kas"
                                                value={shift.actual_cash}
                                                formatter={v => formatRupiah(v)}
                                                prefix={<WalletOutlined />}
                                            />
                                        </Col>
                                    )}
                                    <Col xs={24} sm={8}>
                                        <Statistic title={Number(shift.summary?.selisih ?? shift.difference ?? 0) < 0 ? "Kekurangan" : "Selisih"} value={shift.summary?.selisih ?? shift.difference ?? 0} formatter={v => formatRupiah(v)} valueStyle={{ color: Number(shift.summary?.selisih ?? shift.difference ?? 0) < 0 ? "var(--semantic-error)" : Number(shift.summary?.selisih ?? shift.difference ?? 0) > 0 ? "var(--semantic-warning)" : "var(--semantic-success)" }} prefix={<SwapOutlined />} />
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Statistic title="Total Transaksi" value={shift.total_transactions} prefix={<ShoppingCartOutlined />} />
                                    </Col>
                                </Row>
                            </Card>

                            {canSendWaReport && (
                                <Card title="Kirim Rekap ke Telegram">
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        <Text type="secondary">
                                            Kirim ringkasan penjualan shift ini ke chat admin Telegram.
                                        </Text>
                                        <Button type="primary" icon={<SendOutlined />} onClick={openWaModal}>
                                            Kirim Rekap Shift ke Telegram
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
                    title="Kirim Rekap Shift ke Telegram"
                    open={waModalOpen}
                    onCancel={() => setWaModalOpen(false)}
                    footer={null}
                    width={640}
                    destroyOnClose
                >
                    <Form layout="vertical">
                        <Form.Item label="Pengeluaran dari Laci">
                            <Table
                                rowKey={(_, index) => index}
                                columns={expenseLineColumns}
                                dataSource={expenseLines}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                size="small"
                                style={{ marginBottom: 8 }}
                            />
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={addExpenseLine}
                                    block
                                >
                                    Tambah Baris
                                </Button>
                                <Text>
                                    Total Pengeluaran dari Laci:{" "}
                                    <Text strong>{formatRupiah(totalExpenseAmount)}</Text>
                                </Text>
                            </Space>
                        </Form.Item>
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
                                Kirim ke Telegram
                            </Button>
                        </Space>
                        <Form.Item label="Pratinjau Pesan">
                            <pre
                                style={{
                                    margin: 0,
                                    padding: 12,
                                    maxHeight: 320,
                                    overflow: "auto",
                                    background: "var(--bg-subtle, #f5f5f5)",
                                    color: "var(--text-primary)",
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
