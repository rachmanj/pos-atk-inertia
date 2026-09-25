import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Button,
    InputNumber,
    Modal,
    Radio,
    Select,
    Space,
    Typography,
} from "antd";
import {
    DeleteOutlined,
    PlusOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import useMobile from "../../Hooks/useMobile";
import { getModalWidth, numericMobileInputProps } from "../../Utils/responsive";

const { Text } = Typography;

const fieldLabelClassName = "pos-field-label";

const AVAILABLE_METHODS = ["cash", "qris", "transfer"];

const methodLabels = {
    cash: "Tunai",
    qris: "QRIS",
    transfer: "Transfer",
};

export default function PosPaymentSummary({
    paymentMethod,
    onPaymentMethodChange,
    discount,
    onDiscountChange,
    discountType,
    onDiscountTypeToggle,
    cash,
    onCashChange,
    cashOptions,
    subtotal,
    discountAmount,
    grandTotal,
    change,
    activeCartsCount,
    onSubmit,
    splitMode,
    paymentParts,
    onPaymentPartAmountChange,
    onPaymentPartMethodChange,
    onAddPaymentPart,
    onRemovePaymentPart,
    onEnterSplitMode,
    partsTotal,
    remaining,
    overAmount,
    canSubmit,
    hasCashPart,
}) {
    const isMobile = useMobile();
    const payButtonRef = useRef(null);
    const [cashModalOpen, setCashModalOpen] = useState(false);
    const [draftCash, setDraftCash] = useState("");

    const isManualTransfer = paymentMethod === "transfer";
    const cashValue = Number(cash || 0);
    const cashPartAmount = hasCashPart
        ? Number(
              paymentParts.find((part) => part.method === "cash")?.amount || 0,
          )
        : 0;

    const showCashSummary =
        (!splitMode && paymentMethod === "cash") ||
        (splitMode && hasCashPart);

    const modalMinCash = splitMode && hasCashPart ? cashPartAmount : grandTotal;

    const modalCashOptions = useMemo(() => {
        if (splitMode && hasCashPart) {
            return cashPartAmount > 0
                ? [
                      cashPartAmount,
                      ...cashOptions.filter((option) => option > cashPartAmount),
                  ].slice(0, 5)
                : [];
        }
        return cashOptions;
    }, [cashOptions, cashPartAmount, hasCashPart, splitMode]);

    const draftCashValue = Number(draftCash || 0);
    const modalChange =
        splitMode && hasCashPart
            ? draftCashValue >= cashPartAmount
                ? draftCashValue - cashPartAmount
                : 0
            : draftCashValue >= grandTotal
              ? draftCashValue - grandTotal
              : 0;

    const modalCanSave = draftCashValue >= modalMinCash && modalMinCash > 0;

    const openCashModal = useCallback(() => {
        setDraftCash(cash);
        setCashModalOpen(true);
    }, [cash]);

    const handleCashMethodActivate = useCallback(
        (e) => {
            e.stopPropagation();
            openCashModal();
        },
        [openCashModal],
    );

    const closeCashModal = () => {
        setCashModalOpen(false);
    };

    const saveCashModal = useCallback(() => {
        const numericDraft = Number(draftCash || 0);
        if (modalMinCash > 0 && numericDraft < modalMinCash) {
            return;
        }
        onCashChange(draftCash === "" ? "" : String(numericDraft));
        setCashModalOpen(false);
        requestAnimationFrame(() => {
            payButtonRef.current?.focus();
        });
    }, [draftCash, modalMinCash, onCashChange]);

    const handlePaymentMethodSelect = (value) => {
        onPaymentMethodChange(value);
        if (value === "cash") {
            openCashModal();
        }
    };

    const handlePaymentPartMethodSelect = (index, method) => {
        onPaymentPartMethodChange(index, method);
        if (method === "cash") {
            openCashModal();
        }
    };

    useEffect(() => {
        if (!cashModalOpen) {
            return undefined;
        }

        const onKeyDown = (e) => {
            if (e.key === "Enter" && !e.defaultPrevented) {
                const tag = document.activeElement?.tagName;
                if (tag === "TEXTAREA") {
                    return;
                }
                e.preventDefault();
                saveCashModal();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [cashModalOpen, saveCashModal]);

    const availableMethodsForRow = (rowIndex) =>
        AVAILABLE_METHODS.filter(
            (method) =>
                method === paymentParts[rowIndex]?.method ||
                !paymentParts.some(
                    (part, index) => index !== rowIndex && part.method === method,
                ),
        );

    const renderCashShortcuts = (options, onPick) => {
        if (options.length === 0) {
            return null;
        }

        return (
            <div className="pos-cash-shortcuts">
                {options.map((option, index) => (
                    <button
                        type="button"
                        key={option}
                        onClick={() => onPick(String(option))}
                    >
                        {index === 0 ? "Pas" : formatRupiah(option)}
                    </button>
                ))}
                <button type="button" onClick={() => onPick("0")}>
                    Reset
                </button>
            </div>
        );
    };

    const renderSummaryStatus = () => {
        if (splitMode) {
            if (hasCashPart) {
                return (
                    <Text type="success" strong className="pos-num">
                        {formatRupiah(change)}
                    </Text>
                );
            }

            if (paymentParts.some((part) => part.method === "transfer")) {
                return (
                    <Text style={{ color: "#8F5F22" }} strong>
                        Menunggu konfirmasi
                    </Text>
                );
            }

            return (
                <Text type="success" strong>
                    Lunas
                </Text>
            );
        }

        if (paymentMethod === "cash") {
            return (
                <Text type="success" strong className="pos-num">
                    {formatRupiah(change)}
                </Text>
            );
        }

        if (isManualTransfer) {
            return (
                <Text style={{ color: "#8F5F22" }} strong>
                    Menunggu konfirmasi
                </Text>
            );
        }

        return (
            <Text type="success" strong>
                Lunas
            </Text>
        );
    };

    const summaryStatusLabel = () => {
        if (splitMode && hasCashPart) {
            return "Kembalian";
        }

        if (!splitMode && paymentMethod === "cash") {
            return "Kembalian";
        }

        return "Status";
    };

    const cashSummaryLabel = () => {
        if (cash === "" || cashValue === 0) {
            return "Ketuk untuk isi uang diterima";
        }
        return `Diterima ${formatRupiah(cashValue)} · Kembalian ${formatRupiah(change)}`;
    };

    return (
        <>
            <form className="pos-payment-form pos-nota-foot" onSubmit={onSubmit}>
                <div className="pos-nota-summary-lines">
                    <div className="pos-nota-line">
                        <span>Subtotal</span>
                        <strong className="pos-num">{formatRupiah(subtotal)}</strong>
                    </div>
                    <div className="pos-nota-line">
                        <span>Diskon</span>
                        <Space.Compact className="pos-nota-discount-compact">
                            <InputNumber
                                min={0}
                                value={discount}
                                onChange={(value) => onDiscountChange(value ?? 0)}
                                size="small"
                                {...numericMobileInputProps(isMobile)}
                            />
                            <Button
                                type={
                                    discountType === "percent" ? "primary" : "default"
                                }
                                size="small"
                                onClick={onDiscountTypeToggle}
                                title={
                                    discountType === "nominal"
                                        ? "Ubah ke persen"
                                        : "Ubah ke nominal"
                                }
                            >
                                {discountType === "nominal" ? "Rp" : "%"}
                            </Button>
                        </Space.Compact>
                    </div>
                    {discountAmount > 0 && (
                        <div className="pos-nota-line pos-nota-line--muted">
                            <span>Potongan</span>
                            <Text type="danger" strong className="pos-num">
                                -{formatRupiah(discountAmount)}
                            </Text>
                        </div>
                    )}
                    <div className="pos-nota-line pos-nota-line--total">
                        <span>TOTAL</span>
                        <strong className="pos-num">{formatRupiah(grandTotal)}</strong>
                    </div>
                </div>

                {splitMode ? (
                    <div className="pos-payment-fields">
                        {paymentParts.map((part, index) => (
                            <div
                                className="pos-payment-field"
                                key={`${part.method}-${index}`}
                            >
                                <div className="pos-split-part-header">
                                    <label className={fieldLabelClassName}>
                                        {index === 0
                                            ? "Metode Utama"
                                            : "Metode Tambahan"}
                                    </label>
                                    {index > 0 && (
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() =>
                                                onRemovePaymentPart(index)
                                            }
                                        >
                                            Hapus
                                        </Button>
                                    )}
                                </div>

                                <Space
                                    direction="vertical"
                                    style={{ width: "100%" }}
                                    size={8}
                                >
                                    {index === 0 ? (
                                        <Text strong>
                                            {methodLabels[part.method]}
                                        </Text>
                                    ) : (
                                        <Select
                                            value={part.method}
                                            onChange={(value) =>
                                                handlePaymentPartMethodSelect(
                                                    index,
                                                    value,
                                                )
                                            }
                                            options={availableMethodsForRow(
                                                index,
                                            ).map((method) => ({
                                                value: method,
                                                label: methodLabels[method],
                                            }))}
                                            style={{ width: "100%" }}
                                        />
                                    )}

                                    <InputNumber
                                        min={0}
                                        placeholder="Nominal"
                                        value={
                                            part.amount == null
                                                ? null
                                                : Number(part.amount)
                                        }
                                        onChange={(value) =>
                                            onPaymentPartAmountChange(
                                                index,
                                                value,
                                            )
                                        }
                                        style={{ width: "100%" }}
                                        {...numericMobileInputProps(isMobile)}
                                    />
                                </Space>
                            </div>
                        ))}

                        {paymentParts.length < 3 && (
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={onAddPaymentPart}
                                block
                            >
                                Tambah metode
                            </Button>
                        )}

                        {remaining !== 0 && (
                            <Alert
                                type={overAmount > 0 ? "error" : "warning"}
                                showIcon
                                className="pos-payment-alert"
                                message={
                                    overAmount > 0
                                        ? `Kelebihan ${formatRupiah(overAmount)}. Kurangi nominal salah satu metode.`
                                        : `Sisa: ${formatRupiah(remaining)}`
                                }
                            />
                        )}

                        {splitMode && (
                            <div className="pos-nota-line">
                                <span>Terbayar</span>
                                <strong className="pos-num">
                                    {formatRupiah(partsTotal)}
                                </strong>
                            </div>
                        )}
                    </div>
                ) : (
                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={onEnterSplitMode}
                        block
                    >
                        Tambah metode pembayaran
                    </Button>
                )}

                {showCashSummary ? (
                    <button
                        type="button"
                        className="pos-cash-pay-summary"
                        onClick={openCashModal}
                        aria-label="Ubah uang diterima tunai"
                    >
                        <WalletOutlined
                            className="pos-cash-pay-summary-icon"
                            aria-hidden="true"
                        />
                        <span className="pos-cash-pay-summary-method">Tunai</span>
                        <span className="pos-cash-pay-summary-detail">
                            {cashSummaryLabel()}
                        </span>
                    </button>
                ) : (
                    <div className="pos-nota-line pos-nota-line--change">
                        <span>{summaryStatusLabel()}</span>
                        {renderSummaryStatus()}
                    </div>
                )}

                {isManualTransfer && !splitMode && (
                    <Alert
                        type="info"
                        showIcon
                        className="pos-payment-alert"
                        message="Pelanggan transfer ke rekening toko. Transaksi akan disimpan sebagai pending dan bisa dikonfirmasi setelah dana masuk."
                    />
                )}

                {paymentMethod === "qris" && !splitMode && (
                    <Alert
                        type="info"
                        showIcon
                        className="pos-payment-alert"
                        message="QRIS dicatat manual. Pastikan pembayaran sudah masuk sebelum menyelesaikan struk."
                    />
                )}

                {!splitMode && (
                    <div className="pos-payment-block">
                        <label className={fieldLabelClassName}>
                            Metode pembayaran
                        </label>
                        <Radio.Group
                            className="pos-method-toggle"
                            style={{ width: "100%" }}
                            value={paymentMethod}
                            onChange={(e) =>
                                handlePaymentMethodSelect(e.target.value)
                            }
                            optionType="button"
                            buttonStyle="solid"
                        >
                            {AVAILABLE_METHODS.map((method) => (
                                <Radio.Button
                                    key={method}
                                    value={method}
                                    className="pos-method-option"
                                    onClick={
                                        method === "cash"
                                            ? handleCashMethodActivate
                                            : undefined
                                    }
                                >
                                    {methodLabels[method]}
                                </Radio.Button>
                            ))}
                        </Radio.Group>
                    </div>
                )}

                <Button
                    ref={payButtonRef}
                    type="primary"
                    size="large"
                    htmlType="submit"
                    className="pos-pay-button"
                    disabled={!canSubmit || activeCartsCount === 0}
                    block
                >
                    <span className="pos-pay-button-label">
                        Bayar &amp; cetak nota
                    </span>
                    <kbd className="pos-pay-kbd">F9</kbd>
                </Button>
            </form>

            <Modal
                title="Uang diterima"
                open={cashModalOpen}
                onCancel={closeCashModal}
                width={getModalWidth(isMobile)}
                zIndex={1200}
                destroyOnClose={false}
                maskClosable
                footer={[
                    <Button key="cancel" onClick={closeCashModal}>
                        Batal
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        onClick={saveCashModal}
                        disabled={modalMinCash > 0 && !modalCanSave}
                    >
                        Simpan
                    </Button>,
                ]}
                className="pos-cash-received-modal"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveCashModal();
                    }}
                >
                    <div className="pos-payment-field">
                        <label className={fieldLabelClassName} htmlFor="pos-cash-modal-input">
                            Uang diterima
                        </label>
                        <InputNumber
                            id="pos-cash-modal-input"
                            className="pos-cash-input"
                            min={0}
                            autoFocus
                            value={draftCash === "" ? null : Number(draftCash)}
                            onChange={(value) =>
                                setDraftCash(
                                    value != null ? String(value) : "",
                                )
                            }
                            required
                            style={{ width: "100%" }}
                            {...numericMobileInputProps(isMobile)}
                        />
                        {renderCashShortcuts(modalCashOptions, setDraftCash)}
                    </div>
                    <div className="pos-cash-modal-change">
                        <span>Kembalian</span>
                        <Text type="success" strong className="pos-num">
                            {formatRupiah(modalChange)}
                        </Text>
                    </div>
                    {modalMinCash > 0 && draftCashValue < modalMinCash && (
                        <Text type="danger" style={{ display: "block", marginTop: 8 }}>
                            Minimal {formatRupiah(modalMinCash)}
                        </Text>
                    )}
                </form>
            </Modal>
        </>
    );
}
