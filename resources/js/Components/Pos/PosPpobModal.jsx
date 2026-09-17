import { DeleteOutlined } from "@ant-design/icons";
import {
    Alert,
    Button,
    Form,
    Input,
    InputNumber,
    Modal,
    Space,
    Tooltip,
} from "antd";
import { formatRupiah } from "../../Utils/format";
import useMobile from "../../Hooks/useMobile";
import {
    getModalWidth,
    numericMobileInputProps,
    responsiveFormLayout,
} from "../../Utils/responsive";

export function isPpobTokenProduct(product, ppobSettings = {}) {
    if (!product) {
        return false;
    }

    const raw = ppobSettings.ppob_token_product_ids || "3207";

    return raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map(Number)
        .includes(product.id);
}

export function defaultTokenSellPrice(tokenNominal, ppobSettings = {}) {
    const nominal = Number(tokenNominal || 0);
    const tokenFee = Number(ppobSettings.ppob_token_fee || 4500);
    const adminFee = Number(ppobSettings.ppob_admin_fee || 2000);

    if (nominal <= 0) {
        return 0;
    }

    return nominal + tokenFee + adminFee;
}

export default function PosPpobModal({
    product,
    open,
    ppobSettings = {},
    customerRef,
    ppobCost,
    adminFee,
    tokenNominal,
    sellPrice,
    sellPriceError,
    onCustomerRefChange,
    onPpobCostChange,
    onAdminFeeChange,
    onTokenNominalChange,
    onSellPriceChange,
    onCancel,
    onSubmit,
}) {
    const isMobile = useMobile();
    const isTokenProduct = isPpobTokenProduct(product, ppobSettings);

    if (!product) {
        return null;
    }

    const handleOk = () => {
        onSubmit({ preventDefault: () => {} });
    };

    const tokenFee = Number(ppobSettings.ppob_token_fee || 4500);
    const nominal = Number(tokenNominal || 0);
    const providerCost = nominal > 0 ? nominal + tokenFee : 0;
    const sellPriceValue = Number(sellPrice || 0);

    return (
        <Modal
            title={product.title}
            open={open}
            onCancel={onCancel}
            okText="Tambah ke Keranjang"
            cancelText="Batal"
            onOk={handleOk}
            destroyOnClose
            width={getModalWidth(isMobile, 480)}
        >
            <Form layout="horizontal" {...responsiveFormLayout}>
                <Form.Item label="No. Pelanggan / Meter / HP (Opsional)">
                    <Input
                        value={customerRef}
                        onChange={(e) => onCustomerRefChange(e.target.value)}
                    />
                </Form.Item>

                {isTokenProduct ? (
                    <>
                        <Form.Item label="Nominal Token (Rp)" required>
                            <InputNumber
                                min={1}
                                className="w-full"
                                style={{ width: "100%" }}
                                value={
                                    tokenNominal === ""
                                        ? null
                                        : Number(tokenNominal)
                                }
                                onChange={(value) =>
                                    onTokenNominalChange(
                                        value != null ? String(value) : "",
                                    )
                                }
                                {...numericMobileInputProps(isMobile)}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Harga Jual ke Customer (Rp)"
                            required
                            validateStatus={sellPriceError ? "error" : ""}
                            help={sellPriceError}
                        >
                            <InputNumber
                                min={providerCost > 0 ? providerCost : 1}
                                className="w-full"
                                style={{ width: "100%" }}
                                value={
                                    sellPrice === "" ? null : Number(sellPrice)
                                }
                                onChange={(value) =>
                                    onSellPriceChange(
                                        value != null ? String(value) : "",
                                    )
                                }
                                {...numericMobileInputProps(isMobile)}
                            />
                        </Form.Item>
                        <Alert
                            type="info"
                            showIcon={false}
                            message={
                                <>
                                    Biaya provider:{" "}
                                    <strong>
                                        {formatRupiah(providerCost)}
                                    </strong>
                                    {" · "}
                                    Admin fee:{" "}
                                    <strong>
                                        {formatRupiah(
                                            Math.max(
                                                0,
                                                sellPriceValue - providerCost,
                                            ),
                                        )}
                                    </strong>
                                </>
                            }
                        />
                    </>
                ) : (
                    <>
                        <Form.Item label="Harga Modal" required>
                            <InputNumber
                                min={1}
                                className="w-full"
                                style={{ width: "100%" }}
                                value={
                                    ppobCost === "" ? null : Number(ppobCost)
                                }
                                onChange={(value) =>
                                    onPpobCostChange(
                                        value != null ? String(value) : "",
                                    )
                                }
                                {...numericMobileInputProps(isMobile)}
                            />
                        </Form.Item>
                        <Form.Item label="Admin Fee" required>
                            <Space.Compact style={{ width: "100%" }}>
                                <InputNumber
                                    min={0}
                                    className="w-full"
                                    style={{ width: "100%" }}
                                    value={
                                        adminFee === ""
                                            ? null
                                            : Number(adminFee)
                                    }
                                    onChange={(value) =>
                                        onAdminFeeChange(
                                            value != null
                                                ? String(value)
                                                : "",
                                        )
                                    }
                                    {...numericMobileInputProps(isMobile)}
                                />
                                <Tooltip title="Nolkan admin fee (Rp 0)">
                                    <Button
                                        type="default"
                                        icon={<DeleteOutlined />}
                                        aria-label="Nolkan admin fee"
                                        onClick={() => onAdminFeeChange("0")}
                                    />
                                </Tooltip>
                            </Space.Compact>
                        </Form.Item>
                        <Alert
                            type="info"
                            showIcon={false}
                            message={
                                <>
                                    Harga Jual:{" "}
                                    <strong>
                                        {formatRupiah(
                                            Number(ppobCost || 0) +
                                                Number(adminFee || 0),
                                        )}
                                    </strong>
                                </>
                            }
                        />
                    </>
                )}
            </Form>
        </Modal>
    );
}
