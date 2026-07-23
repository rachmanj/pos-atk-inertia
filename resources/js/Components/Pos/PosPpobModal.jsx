import { Alert, Form, Input, InputNumber, Modal } from "antd";
import { formatRupiah } from "../../Utils/format";
import useMobile from "../../Hooks/useMobile";
import {
    getModalWidth,
    numericMobileInputProps,
    responsiveFormLayout,
} from "../../Utils/responsive";

export default function PosPpobModal({
    product,
    open,
    customerRef,
    ppobCost,
    adminFee,
    onCustomerRefChange,
    onPpobCostChange,
    onAdminFeeChange,
    onCancel,
    onSubmit,
}) {
    const isMobile = useMobile();

    if (!product) {
        return null;
    }

    const handleOk = () => {
        onSubmit({ preventDefault: () => {} });
    };

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
                <Form.Item label="Harga Modal" required>
                    <InputNumber
                        min={1}
                        className="w-full"
                        style={{ width: "100%" }}
                        value={ppobCost === "" ? null : Number(ppobCost)}
                        onChange={(value) =>
                            onPpobCostChange(value != null ? String(value) : "")
                        }
                        {...numericMobileInputProps(isMobile)}
                    />
                </Form.Item>
                <Form.Item label="Admin Fee" required>
                    <InputNumber
                        min={0}
                        className="w-full"
                        style={{ width: "100%" }}
                        value={adminFee === "" ? null : Number(adminFee)}
                        onChange={(value) =>
                            onAdminFeeChange(value != null ? String(value) : "")
                        }
                        {...numericMobileInputProps(isMobile)}
                    />
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
            </Form>
        </Modal>
    );
}
