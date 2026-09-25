import {
    Alert,
    Button,
    InputNumber,
    Radio,
    Select,
    Space,
    Typography,
} from "antd";
import {
    DeleteOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import useMobile from "../../Hooks/useMobile";
import { numericMobileInputProps } from "../../Utils/responsive";

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
    const isManualTransfer = paymentMethod === "transfer";
    const cashPartAmount = hasCashPart
        ? Number(
              paymentParts.find((part) => part.method === "cash")?.amount || 0,
          )
        : 0;

    const availableMethodsForRow = (rowIndex) =>
        AVAILABLE_METHODS.filter(
            (method) =>
                method === paymentParts[rowIndex]?.method ||
                !paymentParts.some(
                    (part, index) => index !== rowIndex && part.method === method,
                ),
        );

    const renderCashShortcuts = (options) => {
        if (options.length === 0) {
            return null;
        }

        return (
            <div className="pos-cash-shortcuts">
                {options.map((option, index) => (
                    <button
                        type="button"
                        key={option}
                        onClick={() => onCashChange(String(option))}
                    >
                        {index === 0 ? "Pas" : formatRupiah(option)}
                    </button>
                ))}
                <button type="button" onClick={() => onCashChange("0")}>
                    Reset
                </button>
            </div>
        );
    };

    const renderSingleMethodCashField = () => {
        if (paymentMethod !== "cash") {
            return null;
        }

        return (
            <div className="pos-payment-field">
                <label className={fieldLabelClassName}>Uang diterima</label>
                <InputNumber
                    className="pos-cash-input"
                    min={0}
                    value={cash === "" ? null : Number(cash)}
                    onChange={(value) =>
                        onCashChange(value != null ? String(value) : "")
                    }
                    required
                    style={{ width: "100%" }}
                    {...numericMobileInputProps(isMobile)}
                />
                {renderCashShortcuts(cashOptions)}
            </div>
        );
    };

    const renderSplitCashField = () => {
        if (!hasCashPart) {
            return null;
        }

        const splitCashOptions =
            cashPartAmount > 0
                ? [
                      cashPartAmount,
                      ...cashOptions.filter((option) => option > cashPartAmount),
                  ].slice(0, 5)
                : [];

        return (
            <div className="pos-payment-field">
                <label className={fieldLabelClassName}>Uang diterima</label>
                <InputNumber
                    className="pos-cash-input"
                    min={0}
                    value={cash === "" ? null : Number(cash)}
                    onChange={(value) =>
                        onCashChange(value != null ? String(value) : "")
                    }
                    required
                    style={{ width: "100%" }}
                    {...numericMobileInputProps(isMobile)}
                />
                {renderCashShortcuts(splitCashOptions)}
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

    return (
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
                                            onPaymentPartMethodChange(
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

                    {renderSplitCashField()}

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
                <>
                    {renderSingleMethodCashField()}
                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={onEnterSplitMode}
                        block
                    >
                        Tambah metode pembayaran
                    </Button>
                </>
            )}

            <div className="pos-nota-line pos-nota-line--change">
                <span>{summaryStatusLabel()}</span>
                {renderSummaryStatus()}
            </div>

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
                        onChange={(e) => onPaymentMethodChange(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        {AVAILABLE_METHODS.map((method) => (
                            <Radio.Button
                                key={method}
                                value={method}
                                className="pos-method-option"
                            >
                                {methodLabels[method]}
                            </Radio.Button>
                        ))}
                    </Radio.Group>
                </div>
            )}

            <Button
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
    );
}
