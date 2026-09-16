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
    CheckCircleOutlined,
    DeleteOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import useMobile from "../../Hooks/useMobile";
import { numericMobileInputProps } from "../../Utils/responsive";

const { Text } = Typography;

const fieldLabelClassName = "pos-field-label";

const SPLIT_METHODS = ["cash", "qris", "transfer"];

const splitMethodLabels = {
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
    const isDigital = paymentMethod === "digital";
    const canUseSplit = !isDigital;
    const cashPartAmount = hasCashPart
        ? Number(
              paymentParts.find((part) => part.method === "cash")?.amount || 0,
          )
        : 0;

    const availableMethodsForRow = (rowIndex) =>
        SPLIT_METHODS.filter(
            (method) =>
                method === paymentParts[rowIndex]?.method ||
                !paymentParts.some((part, index) => index !== rowIndex && part.method === method),
        );

    const renderSingleMethodCashField = () => {
        if (paymentMethod !== "cash") {
            return null;
        }

        return (
            <div className="pos-payment-field">
                <label className={fieldLabelClassName}>Uang Tunai</label>
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

                {cashOptions.length > 0 && (
                    <div className="pos-cash-shortcuts">
                        {cashOptions.map((option, index) => (
                            <button
                                type="button"
                                key={option}
                                onClick={() => onCashChange(String(option))}
                            >
                                {index === 0 ? "Pas" : formatRupiah(option)}
                            </button>
                        ))}
                    </div>
                )}
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
                <label className={fieldLabelClassName}>Uang Tunai</label>
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

                {splitCashOptions.length > 0 && (
                    <div className="pos-cash-shortcuts">
                        {splitCashOptions.map((option, index) => (
                            <button
                                type="button"
                                key={option}
                                onClick={() => onCashChange(String(option))}
                            >
                                {index === 0 ? "Pas" : formatRupiah(option)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderSummaryStatus = () => {
        if (splitMode) {
            if (hasCashPart) {
                return (
                    <Text type="success" strong>
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
                <Text type="success" strong>
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

        if (paymentMethod === "digital") {
            return (
                <Text type="success" strong>
                    Menunggu pembayaran
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
        <form className="pos-payment-form" onSubmit={onSubmit}>
            <div className="pos-payment-block">
                <label className={fieldLabelClassName}>Metode Pembayaran</label>
                <Radio.Group
                    className="pos-method-toggle"
                    style={{ width: "100%" }}
                    value={paymentMethod}
                    onChange={(e) => onPaymentMethodChange(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                >
                    <Radio.Button value="cash" className="pos-method-option">
                        Tunai
                    </Radio.Button>
                    <Radio.Button value="digital" className="pos-method-option">
                        Digital
                    </Radio.Button>
                    <Radio.Button value="qris" className="pos-method-option">
                        QRIS
                    </Radio.Button>
                    <Radio.Button value="transfer" className="pos-method-option">
                        Transfer
                    </Radio.Button>
                </Radio.Group>
            </div>

            <div className="pos-payment-fields">
                <div className="pos-payment-field">
                    <label className={fieldLabelClassName}>Diskon</label>
                    <Space.Compact style={{ width: "100%" }}>
                        <InputNumber
                            min={0}
                            value={discount}
                            onChange={(value) => onDiscountChange(value ?? 0)}
                            style={{ flex: 1, width: "100%" }}
                            {...numericMobileInputProps(isMobile)}
                        />
                        <Button
                            type={
                                discountType === "percent" ? "primary" : "default"
                            }
                            onClick={onDiscountTypeToggle}
                            style={{ width: "4rem" }}
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

                {splitMode ? (
                    <>
                        {paymentParts.map((part, index) => (
                            <div
                                className="pos-payment-field"
                                key={`${part.method}-${index}`}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        marginBottom: 6,
                                    }}
                                >
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
                                            {splitMethodLabels[part.method]}
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
                                                label: splitMethodLabels[method],
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

                        {canUseSplit && paymentParts.length < 3 && (
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
                                        ? `Kelebihan ${formatRupiah(overAmount)} — kurangi nominal salah satu metode`
                                        : `Sisa: ${formatRupiah(remaining)}`
                                }
                            />
                        )}
                    </>
                ) : (
                    <>
                        {renderSingleMethodCashField()}

                        {canUseSplit && (
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={onEnterSplitMode}
                                block
                            >
                                Tambah metode
                            </Button>
                        )}
                    </>
                )}
            </div>

            {isDigital && (
                <Alert
                    type="info"
                    showIcon
                    className="pos-payment-alert"
                    message="Pembayaran digital akan diproses melalui Midtrans. Kasir tidak perlu mengisi uang tunai."
                />
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
                    message="QRIS dicatat manual — pastikan pembayaran sudah masuk sebelum menyelesaikan struk."
                />
            )}

            <div className="pos-summary-box">
                <div>
                    <span>Subtotal</span>
                    <strong>{formatRupiah(subtotal)}</strong>
                </div>
                <div>
                    <span>Diskon</span>
                    <Text type="danger" strong>
                        -{formatRupiah(discountAmount)}
                    </Text>
                </div>
                <div className="pos-summary-total">
                    <span>Total</span>
                    <strong>{formatRupiah(grandTotal)}</strong>
                </div>
                {splitMode && (
                    <div>
                        <span>Terbayar</span>
                        <strong>{formatRupiah(partsTotal)}</strong>
                    </div>
                )}
                <div>
                    <span>{summaryStatusLabel()}</span>
                    {renderSummaryStatus()}
                </div>
            </div>

            <Button
                type="primary"
                size="large"
                htmlType="submit"
                className="pos-pay-button"
                icon={<CheckCircleOutlined />}
                disabled={!canSubmit}
                block
            >
                Proses Pembayaran
            </Button>
        </form>
    );
}
