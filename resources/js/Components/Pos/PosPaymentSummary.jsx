import {
    Alert,
    Button,
    Col,
    InputNumber,
    Radio,
    Row,
    Space,
    Typography,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";

const { Text } = Typography;

const fieldLabelClassName =
    "mb-1.5 block text-[0.82rem] font-extrabold text-[#7a6b67]";

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
                <label className={fieldLabelClassName}>Metode Pembayaran</label>
                <Radio.Group
                    className="pos-method-toggle w-full"
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

            <Row gutter={[8, 8]} className="mb-3">
                <Col span={isCashLikePayment ? 10 : 24}>
                    <label className={fieldLabelClassName}>Diskon</label>
                    <Space.Compact style={{ width: "100%" }}>
                        <InputNumber
                            min={0}
                            value={discount}
                            onChange={(value) => onDiscountChange(value ?? 0)}
                            style={{ flex: 1 }}
                            className="w-full"
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
                </Col>

                {isCashLikePayment && (
                    <Col span={14}>
                        <label className={fieldLabelClassName}>{cashLabel}</label>
                        <InputNumber
                            className="pos-cash-input w-full"
                            min={0}
                            value={cash === "" ? null : Number(cash)}
                            onChange={(value) =>
                                onCashChange(value != null ? String(value) : "")
                            }
                            required
                            style={{ width: "100%" }}
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
                    </Col>
                )}
            </Row>

            {paymentMethod === "digital" && (
                <Alert
                    type="info"
                    showIcon
                    className="mb-3 text-xs"
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
                    <Text type="danger" strong>
                        -{formatRupiah(discountAmount)}
                    </Text>
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
                className="pos-pay-button"
                icon={<CheckCircleOutlined />}
                disabled={activeCartsCount === 0}
                block
            >
                Proses Pembayaran
            </Button>
        </form>
    );
}
