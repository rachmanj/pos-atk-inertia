import { Form, Input, Modal } from "antd";

export default function PosQuickCustomerModal({
    open,
    name,
    phone,
    onNameChange,
    onPhoneChange,
    onCancel,
    onSubmit,
}) {
    return (
        <Modal
            title="Tambah Pelanggan Cepat"
            open={open}
            onCancel={onCancel}
            okText="Simpan & Pilih"
            cancelText="Batal"
            onOk={() => onSubmit({ preventDefault: () => {} })}
            destroyOnClose
        >
            <Form layout="vertical">
                <Form.Item label="Nama" required>
                    <Input
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        autoFocus
                    />
                </Form.Item>
                <Form.Item label="No. HP (opsional)">
                    <Input
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
