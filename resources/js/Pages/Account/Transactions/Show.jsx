import React, { useEffect, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { formatRupiah } from "../../../Utils/format";
import hasAnyPermission from "../../../Utils/Permissions";
import Swal from "sweetalert2";

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
    const receiptPrintWidth = getReceiptPrintWidth(receiptPaperSize);

    const details = transaction.details || [];

    const subtotal = details.reduce(
        (total, detail) => total + Number(detail.subtotal || 0),
        0,
    );

    const formatDateTime = (value) => {
        if (!value) {
            return "-";
        }

        return new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    };

    const paymentMethodLabel = {
        cash: "Tunai",
        digital: "Digital",
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

    const handleVoid = () => {
        Swal.fire({
            title: "Void transaksi?",
            text: "Transaksi akan dibatalkan, stok produk dikembalikan, dan profit transaksi dinolkan.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, void transaksi",
            cancelButtonText: "Batal",
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(`/account/transactions/${transaction.invoice}/void`);
            }
        });
    };

    useEffect(() => {
        if (flash.success) {
            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: flash.success,
                timer: 2000,
                showConfirmButton: false,
            });
        }

        if (flash.error) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: flash.error,
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
                <title>Struk Transaksi - ZenPOS</title>
            </Head>

            <div className="transaction-show-page">
                <div className="transaction-show-shell">
                    <div className="transaction-show-header no-print">
                        <div className="transaction-show-heading">
                            <button
                                type="button"
                                className="transaction-back-button"
                                onClick={handleBack}
                                title="Kembali"
                                aria-label="Kembali"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>

                            <div className="transaction-show-title">
                                <span>Detail Transaksi</span>
                                <h4>{transaction.invoice}</h4>
                                <small>
                                    {formatDateTime(transaction.created_at)}
                                </small>
                            </div>
                        </div>

                        <span
                            className={`transaction-status-chip ${
                                statusClass[transaction.status] || "is-warning"
                            }`}
                        >
                            {statusLabel[transaction.status] ||
                                transaction.status ||
                                "-"}
                        </span>
                    </div>

                    <div className="transaction-show-workspace">
                        <div className="transaction-action-panel no-print">
                            <div className="transaction-action-card">
                                <div className="transaction-action-card__header">
                                    <span>Aksi Transaksi</span>
                                    <strong>{transaction.invoice}</strong>
                                </div>

                                <div className="transaction-action-list">
                                    <Link
                                        href="/account/transactions/create"
                                        className="btn btn-success"
                                    >
                                        <i className="fas fa-cash-register"></i>
                                        POS Kasir
                                    </Link>

                                    <div className="receipt-paper-size-control">
                                        <span>Ukuran Struk</span>
                                        <div
                                            className="receipt-paper-size-options"
                                            role="group"
                                            aria-label="Ukuran struk"
                                        >
                                            {RECEIPT_PAPER_SIZES.map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    className={`receipt-paper-size-option ${
                                                        receiptPaperSize ===
                                                        size
                                                            ? "is-active"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        setReceiptPaperSize(
                                                            size,
                                                        )
                                                    }
                                                >
                                                    {size}mm
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={handlePrint}
                                    >
                                        <i className="fas fa-print"></i>
                                        Cetak Struk
                                    </button>

                                    {canVoidTransaction && (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={handleVoid}
                                        >
                                            <i className="fas fa-ban"></i>
                                            Void Transaksi
                                        </button>
                                    )}

                                    {canCreateReturn && (
                                        <Link
                                            href={`/account/returns/create/${transaction.invoice}`}
                                            className="btn btn-warning text-dark"
                                        >
                                            <i className="fas fa-undo"></i>
                                            Ajukan Retur
                                        </Link>
                                    )}
                                </div>
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
                                                    <i className="fas fa-store receipt-logo-placeholder"></i>
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
                                                    paymentStatusClass[
                                                        transaction
                                                            .payment_status
                                                    ] || "is-pending"
                                                }`}
                                            >
                                                {paymentStatusLabel[
                                                    transaction.payment_status
                                                ] ||
                                                    transaction.payment_status ||
                                                    "-"}
                                            </span>
                                        </div>

                                        <div className="receipt-divider"></div>

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

                                        <div className="receipt-divider"></div>

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

                                        <div className="receipt-divider"></div>

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
                                                <div className="receipt-divider"></div>

                                                <div className="receipt-note">
                                                    {transaction.note}
                                                </div>
                                            </>
                                        )}

                                        <div className="receipt-divider"></div>

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
