import {
    Alert,
    Button,
    InputNumber,
    Radio,
    Space,
    Typography,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";

const { Text } = Typography;

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
    isCashLikePayment,
    subtotal,
    discountAmount,
    grandTotal,
    change,
    activeCartsCount,
    onSubmit,
}) {
    const cashLabel =
        paymentMethod === "cash"
            ? "Uang Tunai"
            : paymentMethod === "qris"
              ? "Nominal QRIS"
              : "Nominal Transfer";

    return (
        <form className="pos-payment-form" onSubmit={onSubmit}>
            <div className="mb-3">
                <label className="form-label">Metode Pembayaran</label>
                <Radio.Group
                    className="pos-method-toggle w-100"
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

            <div className="row g-2 mb-3">
                <div className={isCashLikePayment ? "col-5" : "col-12"}>
                    <label className="form-label">Diskon</label>
                    <Space.Compact style={{ width: "100%" }}>
                        <InputNumber
                            min={0}
                            value={discount}
                            onChange={(value) => onDiscountChange(value ?? 0)}
                            style={{ flex: 1 }}
                            className="w-100"
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

                {isCashLikePayment && (
                    <div className="col-7">
                        <label className="form-label">{cashLabel}</label>
                        <InputNumber
                            className="pos-cash-input w-100"
                            min={0}
                            value={cash === "" ? null : Number(cash)}
                            onChange={(value) =>
                                onCashChange(value != null ? String(value) : "")
                            }
                            required
                        />

                        {cashOptions.length > 0 && (
                            <div className="pos-cash-shortcuts">
                                {cashOptions.map((option, index) => (
                                    <button
                                        type="button"
                                        key={option}
                                        onClick={() =>
                                            onCashChange(String(option))
                                        }
                                    >
                                        {index === 0
                                            ? "Pas"
                                            : formatRupiah(option)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {paymentMethod === "digital" && (
                <Alert
                    type="info"
                    showIcon
                    className="mb-3 small"
                    message="Pembayaran digital akan diproses melalui Midtrans. Kasir tidak perlu mengisi uang tunai."
                />
            )}

            <div className="pos-summary-box">
                <div>
                    <span>Subtotal</span>
                    <strong>{formatRupiah(subtotal)}</strong>
                </div>
                <div>
                    <span>Diskon</span>
                    <strong className="text-danger">
                        -{formatRupiah(discountAmount)}
                    </strong>
                </div>
                <div className="pos-summary-total">
                    <span>Total</span>
                    <strong>{formatRupiah(grandTotal)}</strong>
                </div>
                <div>
                    <span>{isCashLikePayment ? "Kembalian" : "Status"}</span>
                    <Text type="success" strong>
                        {isCashLikePayment
                            ? formatRupiah(change)
                            : "Menunggu pembayaran"}
                    </Text>
                </div>
            </div>

            <Button
                type="primary"
                size="large"
                htmlType="submit"
                className="w-100 pos-pay-button"
                icon={<CheckCircleOutlined />}
                disabled={activeCartsCount === 0}
                block
            >
                Proses Pembayaran
            </Button>
        </form>
    );
}
