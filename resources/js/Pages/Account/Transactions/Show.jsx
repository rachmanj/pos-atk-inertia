import React, { useEffect, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Alert,
    Button,
    Input,
    Modal,
    Radio,
    Space,
    Tag,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    StopOutlined,
    PrinterOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    UndoOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../../Utils/format";
import hasAnyPermission from "../../../Utils/Permissions";

const { Text } = Typography;

const RECEIPT_PAPER_SIZES = ["58", "80"];

const normalizeReceiptPaperSize = (value) => {
    const paperSize = String(value || "58");
    return RECEIPT_PAPER_SIZES.includes(paperSize) ? paperSize : "58";
};

const getReceiptPrintWidth = (paperSize) =>
    paperSize === "80" ? "80mm" : "58mm";

export default function TransactionShow() {
    const {
        transaction = {},
        flash = {},
        auth = {},
        store = {},
    } = usePage().props;

    const permissions = auth.permissions || {};
    const storeName = store?.name || "ZEN POS";
    const storeAddress = store?.address || "Jl. Contoh No. 123";
    const storePhone = store?.phone || "0812-3456-7890";
    const storeLogo = store?.logo_url;
    const [receiptPaperSize, setReceiptPaperSize] = useState(() =>
        normalizeReceiptPaperSize(store?.receipt_paper_size),
    );
    const voidReasonRef = useRef("");
    const receiptPrintWidth = getReceiptPrintWidth(receiptPaperSize);

    const details = transaction.details || [];

    const subtotal = details.reduce(
        (total, detail) => total + Number(detail.subtotal || 0),
        0,
    );

    const formatDateTime = (value) => {
        if (!value) return "-";
        return new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    };

    const paymentMethodLabel = {
        cash: "Tunai",
        digital: "Digital",
        qris: "QRIS",
        transfer: "Transfer",
    };

    const statusLabel = {
        completed: "Selesai",
        pending: "Pending",
        voided: "Dibatalkan",
    };

    const statusClass = {
        completed: "is-success",
        pending: "is-warning",
        voided: "is-danger",
    };

    const paymentStatusLabel = {
        unpaid: "Belum Bayar",
        paid: "Lunas",
        pending: "Pending",
        failed: "Gagal",
        expired: "Expired",
    };

    const paymentStatusClass = {
        unpaid: "is-pending",
        paid: "is-paid",
        pending: "is-pending",
        failed: "is-voided",
        expired: "is-voided",
    };

    const hasBlockingReturn =
        Number(transaction.blocking_returns_count || 0) > 0;

    const isTransferPending =
        transaction.payment_method === "transfer" &&
        transaction.payment_status === "pending" &&
        transaction.status === "pending";

    const canConfirmTransfer =
        isTransferPending &&
        hasAnyPermission(["transactions.edit"], permissions);

    const displayStatusLabel = isTransferPending
        ? "Menunggu Konfirmasi Transfer"
        : statusLabel[transaction.status] ||
          transaction.status ||
          "-";

    const canVoidTransaction =
        hasAnyPermission(["transactions.void"], permissions) &&
        transaction.status === "completed" &&
        transaction.payment_status === "paid" &&
        !hasBlockingReturn;

    const canCreateReturn =
        hasAnyPermission(["returns.create"], permissions) &&
        transaction.status === "completed" &&
        transaction.payment_status === "paid" &&
        !transaction.active_return;

    const handlePrint = () => {
        let pageStyle = document.getElementById("receipt-print-page-style");

        if (!pageStyle) {
            pageStyle = document.createElement("style");
            pageStyle.id = "receipt-print-page-style";
            document.head.appendChild(pageStyle);
        }

        pageStyle.textContent = `
            @media print {
                @page {
                    size: ${receiptPrintWidth} auto;
                    margin: 0;
                }
            }
        `;

        document.body.classList.add("printing-receipt");
        window.print();
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        router.visit("/account/transactions");
    };

    const handleConfirmTransfer = () => {
        Modal.confirm({
            title: "Konfirmasi pembayaran transfer?",
            content:
                "Pastikan dana sudah masuk ke rekening toko sebelum mengonfirmasi transaksi ini.",
            okText: "Ya, konfirmasi",
            cancelText: "Batal",
            onOk: () =>
                router.post(
                    `/account/transactions/${transaction.invoice}/confirm-transfer`,
                ),
        });
    };

    const handleVoid = () => {
        voidReasonRef.current = "";
        Modal.confirm({
            title: "Void transaksi?",
            content: (
                <div>
                    <p>
                        Transaksi akan dibatalkan, stok produk dikembalikan,
                        dan profit transaksi dinolkan.
                    </p>
                    <Text strong style={{ display: "block", marginBottom: 4 }}>
                        Alasan pembatalan (wajib)
                    </Text>
                    <Input.TextArea
                        rows={3}
                        placeholder="Tulis alasan void transaksi..."
                        onChange={(e) => {
                            voidReasonRef.current = e.target.value;
                        }}
                    />
                </div>
            ),
            okText: "Ya, void transaksi",
            cancelText: "Batal",
            okButtonProps: { danger: true },
            onOk: () => {
                const reason = voidReasonRef.current.trim();
                if (!reason) {
                    notification.error({
                        message: "Alasan void wajib diisi!",
                    });
                    return Promise.reject();
                }
                router.put(
                    `/account/transactions/${transaction.invoice}/void`,
                    { void_reason: reason },
                );
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

    useEffect(() => {
        const removePrintClass = () => {
            document.body.classList.remove("printing-receipt");
        };

        window.addEventListener("afterprint", removePrintClass);
        return () => {
            window.removeEventListener("afterprint", removePrintClass);
            document.body.classList.remove("printing-receipt");
        };
    }, []);

    return (
        <>
            <Head>
                <title>Struk Transaksi - VASIA Stationery</title>
            </Head>

            <div className="transaction-show-page">
                <div className="transaction-show-shell">
                    <div className="transaction-show-header no-print">
                        <div className="transaction-show-heading">
                            <Button
                                type="text"
                                className="transaction-back-button"
                                icon={<ArrowLeftOutlined />}
                                onClick={handleBack}
                                title="Kembali"
                                aria-label="Kembali"
                            />

                            <div className="transaction-show-title">
                                <span>Detail Transaksi</span>
                                <h4>{transaction.invoice}</h4>
                                <small>
                                    {formatDateTime(transaction.created_at)}
                                </small>
                            </div>
                        </div>

                        <Tag
                            className={`transaction-status-chip ${
                                isTransferPending
                                    ? "is-warning"
                                    : statusClass[transaction.status] ||
                                      "is-warning"
                            }`}
                        >
                            {displayStatusLabel}
                        </Tag>
                    </div>

                    <div className="transaction-show-workspace">
                        <div className="transaction-action-panel no-print">
                            <div className="transaction-action-card">
                                <div className="transaction-action-card__header">
                                    <span>Aksi Transaksi</span>
                                    <strong>{transaction.invoice}</strong>
                                </div>

                                <Space
                                    direction="vertical"
                                    className="transaction-action-list"
                                    size="middle"
                                    style={{ width: "100%" }}
                                >
                                    {isTransferPending && (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            message="Menunggu Konfirmasi Transfer"
                                            description="Pelanggan transfer ke rekening toko. Konfirmasi setelah dana masuk."
                                        />
                                    )}

                                    {canConfirmTransfer && (
                                        <Button
                                            type="primary"
                                            block
                                            icon={<CheckCircleOutlined />}
                                            onClick={handleConfirmTransfer}
                                            style={{
                                                background: "#2F6F4E",
                                                borderColor: "#2F6F4E",
                                            }}
                                        >
                                            Konfirmasi Pembayaran
                                        </Button>
                                    )}

                                    <Link href="/account/transactions/create">
                                        <Button
                                            type="primary"
                                            block
                                            icon={<ShoppingCartOutlined />}
                                        >
                                            POS Kasir
                                        </Button>
                                    </Link>

                                    <div className="receipt-paper-size-control">
                                        <span>Ukuran Struk</span>
                                        <Radio.Group
                                            className="receipt-paper-size-options"
                                            value={receiptPaperSize}
                                            onChange={(e) =>
                                                setReceiptPaperSize(
                                                    e.target.value,
                                                )
                                            }
                                            optionType="button"
                                            buttonStyle="solid"
                                        >
                                            {RECEIPT_PAPER_SIZES.map((size) => (
                                                <Radio.Button
                                                    key={size}
                                                    value={size}
                                                    className={`receipt-paper-size-option ${
                                                        receiptPaperSize ===
                                                        size
                                                            ? "is-active"
                                                            : ""
                                                    }`}
                                                >
                                                    {size}mm
                                                </Radio.Button>
                                            ))}
                                        </Radio.Group>
                                    </div>

                                    <Button
                                        block
                                        icon={<PrinterOutlined />}
                                        onClick={handlePrint}
                                    >
                                        Cetak Struk
                                    </Button>

                                    {canVoidTransaction && (
                                        <Button
                                            danger
                                            block
                                            icon={<StopOutlined />}
                                            onClick={handleVoid}
                                        >
                                            Void Transaksi
                                        </Button>
                                    )}

                                    {canCreateReturn && (
                                        <Link
                                            href={`/account/returns/create/${transaction.invoice}`}
                                        >
                                            <Button
                                                block
                                                icon={<UndoOutlined />}
                                                style={{
                                                    background: "#8F5F22",
                                                    borderColor: "#8F5F22",
                                                    color: "#fff",
                                                }}
                                            >
                                                Ajukan Retur
                                            </Button>
                                        </Link>
                                    )}
                                </Space>
                            </div>

                            <div className="transaction-summary-card">
                                <div className="transaction-summary-row">
                                    <span>Total</span>
                                    <strong>
                                        {formatRupiah(transaction.grand_total)}
                                    </strong>
                                </div>
                                <div className="transaction-summary-row">
                                    <span>Metode</span>
                                    <strong>
                                        {paymentMethodLabel[
                                            transaction.payment_method
                                        ] ||
                                            transaction.payment_method ||
                                            "-"}
                                    </strong>
                                </div>
                                <div className="transaction-summary-row">
                                    <span>Pelanggan</span>
                                    <strong>
                                        {transaction.customer?.name || "Umum"}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="transaction-receipt-panel">
                            <div className="transaction-receipt-panel__header no-print">
                                <span>Preview Struk</span>
                                <small>
                                    Tampilan ini akan dicetak sebagai struk
                                    transaksi.
                                </small>
                            </div>

                            <div className="receipt-stage">
                                <div
                                    id="print-area"
                                    className={`receipt-paper receipt-paper--${receiptPaperSize}mm ${
                                        transaction.status === "voided"
                                            ? "is-voided"
                                            : ""
                                    }`}
                                >
                                    <div className="receipt-paper__body">
                                        <div className="receipt-header">
                                            <div className="receipt-logo-frame">
                                                {storeLogo ? (
                                                    <img
                                                        src={storeLogo}
                                                        alt={storeName}
                                                        className="receipt-logo"
                                                    />
                                                ) : (
                                                    <ShopOutlined className="receipt-logo-placeholder" />
                                                )}
                                            </div>

                                            <h4 className="receipt-store-name">
                                                {storeName}
                                            </h4>

                                            <p className="receipt-store-meta">
                                                {storeAddress}
                                                {storePhone
                                                    ? `\nTelp: ${storePhone}`
                                                    : ""}
                                            </p>

                                            <span
                                                className={`receipt-status-pill ${
                                                    isTransferPending
                                                        ? "is-pending"
                                                        : paymentStatusClass[
                                                              transaction
                                                                  .payment_status
                                                          ] || "is-pending"
                                                }`}
                                            >
                                                {isTransferPending
                                                    ? "Menunggu Konfirmasi Transfer"
                                                    : paymentStatusLabel[
                                                          transaction
                                                              .payment_status
                                                      ] ||
                                                      transaction.payment_status ||
                                                      "-"}
                                            </span>
                                        </div>

                                        <div className="receipt-divider" />

                                        <div className="receipt-meta">
                                            <div className="receipt-meta-row">
                                                <span>Invoice</span>
                                                <span>
                                                    {transaction.invoice}
                                                </span>
                                            </div>
                                            <div className="receipt-meta-row">
                                                <span>Tanggal</span>
                                                <span>
                                                    {formatDateTime(
                                                        transaction.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="receipt-meta-row">
                                                <span>Kasir</span>
                                                <span>
                                                    {transaction.cashier
                                                        ?.name || "-"}
                                                </span>
                                            </div>
                                            <div className="receipt-meta-row">
                                                <span>Pelanggan</span>
                                                <span>
                                                    {transaction.customer
                                                        ?.name || "Umum"}
                                                </span>
                                            </div>
                                            <div className="receipt-meta-row">
                                                <span>Metode</span>
                                                <span>
                                                    {paymentMethodLabel[
                                                        transaction
                                                            .payment_method
                                                    ] ||
                                                        transaction.payment_method ||
                                                        "-"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="receipt-divider" />

                                        <div className="receipt-section-title">
                                            Item Belanja
                                        </div>

                                        <div className="receipt-items">
                                            {details.map((detail) => (
                                                <div
                                                    className="receipt-item"
                                                    key={detail.id}
                                                >
                                                    <div className="receipt-item__main">
                                                        <div className="receipt-item__name">
                                                            {detail.product
                                                                ?.title || "-"}
                                                        </div>
                                                        <div className="receipt-item__meta">
                                                            {detail.qty} x{" "}
                                                            {formatRupiah(
                                                                detail.price,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="receipt-item__subtotal">
                                                        {formatRupiah(
                                                            detail.subtotal,
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="receipt-divider" />

                                        <div className="receipt-summary">
                                            <div className="receipt-summary-row">
                                                <span>Subtotal</span>
                                                <span>
                                                    {formatRupiah(subtotal)}
                                                </span>
                                            </div>
                                            <div className="receipt-summary-row">
                                                <span>Diskon</span>
                                                <span>
                                                    -
                                                    {formatRupiah(
                                                        transaction.discount,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="receipt-summary-row receipt-summary-row--total">
                                                <span>Total</span>
                                                <span>
                                                    {formatRupiah(
                                                        transaction.grand_total,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="receipt-summary-row">
                                                <span>Tunai</span>
                                                <span>
                                                    {formatRupiah(
                                                        transaction.cash,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="receipt-summary-row">
                                                <span>Kembali</span>
                                                <span>
                                                    {formatRupiah(
                                                        transaction.change,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {transaction.note && (
                                            <>
                                                <div className="receipt-divider" />
                                                <div className="receipt-note">
                                                    {transaction.note}
                                                </div>
                                            </>
                                        )}

                                        <div className="receipt-divider" />

                                        <div className="receipt-footer">
                                            <div className="receipt-footer__headline">
                                                Terima kasih
                                            </div>
                                            <div className="receipt-footer__text">
                                                Barang yang sudah dibeli tidak
                                                dapat ditukar kecuali ada
                                                perjanjian sebelumnya.
                                            </div>
                                            <span className="receipt-footer__code">
                                                {transaction.invoice}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
