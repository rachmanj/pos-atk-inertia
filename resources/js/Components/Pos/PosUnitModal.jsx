import { Form, Modal, Select, Typography } from "antd";
import useMobile from "../../Hooks/useMobile";
import { getModalWidth, responsiveFormLayout } from "../../Utils/responsive";

const { Text } = Typography;

export default function PosUnitModal({
    product,
    open,
    selectedUnitId,
    onUnitChange,
    onCancel,
    onSubmit,
}) {
    const isMobile = useMobile();

    if (!product) {
        return null;
    }

    const units = product.product_units || [];

    return (
        <Modal
            title="Pilih Satuan"
            open={open}
            onCancel={onCancel}
            okText="Tambah"
            cancelText="Batal"
            onOk={() => onSubmit({ preventDefault: () => {} })}
            destroyOnClose
            width={getModalWidth(isMobile, 480)}
        >
            <Form layout="horizontal" {...responsiveFormLayout}>
                <Text className="block mb-3">{product.title}</Text>
                <Form.Item label="Satuan" required>
                    <Select
                        value={selectedUnitId || undefined}
                        onChange={onUnitChange}
                        options={units.map((row) => ({
                            value: String(row.unit_id),
                            label: `${row.unit?.name} (${row.unit?.abbreviation}) - Rp ${Number(row.sell_price).toLocaleString("id-ID")}`,
                        }))}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
