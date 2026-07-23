import { Form, Input, Modal } from "antd";
import useMobile from "../../Hooks/useMobile";
import { getModalWidth, responsiveFormLayout } from "../../Utils/responsive";

export default function PosQuickCustomerModal({
    open,
    name,
    phone,
    onNameChange,
    onPhoneChange,
    onCancel,
    onSubmit,
}) {
    const isMobile = useMobile();

    return (
        <Modal
            title="Tambah Pelanggan Cepat"
            open={open}
            onCancel={onCancel}
            okText="Simpan & Pilih"
            cancelText="Batal"
            onOk={() => onSubmit({ preventDefault: () => {} })}
            destroyOnClose
            width={getModalWidth(isMobile, 480)}
        >
            <Form layout="horizontal" {...responsiveFormLayout}>
                <Form.Item label="Nama" required>
                    <Input
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        autoFocus
                    />
                </Form.Item>
                <Form.Item label="No. HP (opsional)">
                    <Input
                        type={isMobile ? "tel" : "text"}
                        inputMode={isMobile ? "tel" : undefined}
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
