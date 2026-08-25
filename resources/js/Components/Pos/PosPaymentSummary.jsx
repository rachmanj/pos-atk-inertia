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
import useMobile from "../../Hooks/useMobile";
import { numericMobileInputProps } from "../../Utils/responsive";

const { Text } = Typography;

const fieldLabelClassName = "pos-field-label";

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
    const isMobile = useMobile();
    const isManualTransfer = paymentMethod === "transfer";
    const cashLabel =
        paymentMethod === "cash"
            ? "Uang Tunai"
            : paymentMethod === "qris"
              ? "Nominal QRIS"
              : "Transfer Manual";

    return (
        <form className="pos-payment-form" onSubmit={onSubmit}>
            <div style={{ marginBottom: 12 }}>
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

            <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col xs={24} md={isCashLikePayment ? 10 : 24}>
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
                </Col>

                {isCashLikePayment && (
                    <Col xs={24} md={14}>
                        <label className={fieldLabelClassName}>{cashLabel}</label>
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
                    style={{ marginBottom: 12, fontSize: 12 }}
                    message="Pembayaran digital akan diproses melalui Midtrans. Kasir tidak perlu mengisi uang tunai."
                />
            )}

            {isManualTransfer && (
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12, fontSize: 12 }}
                    message="Pelanggan transfer ke rekening toko. Transaksi akan disimpan sebagai pending dan bisa dikonfirmasi setelah dana masuk."
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
                    <span>
                        {isCashLikePayment
                            ? "Kembalian"
                            : isManualTransfer
                              ? "Status"
                              : "Status"}
                    </span>
                    {isCashLikePayment ? (
                        <Text type="success" strong>
                            {formatRupiah(change)}
                        </Text>
                    ) : isManualTransfer ? (
                        <Text style={{ color: "#8F5F22" }} strong>
                            Menunggu konfirmasi
                        </Text>
                    ) : (
                        <Text type="success" strong>
                            Menunggu pembayaran
                        </Text>
                    )}
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
