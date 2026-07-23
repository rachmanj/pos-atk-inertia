import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Switch,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
    TruckOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

export default function SupplierEdit() {
    const { errors = {}, supplier } = usePage().props;

    const [name, setName] = useState(supplier.name);
    const [phone, setPhone] = useState(supplier.no_telp || "");
    const [email, setEmail] = useState(supplier.email || "");
    const [address, setAddress] = useState(supplier.address || "");
    const [note, setNote] = useState(supplier.note || "");
    const [isActive, setIsActive] = useState(Boolean(supplier.is_active));
    const [saving, setSaving] = useState(false);

    const updateSupplier = (e) => {
        e.preventDefault();
        setSaving(true);

        router.put(
            `/account/suppliers/${supplier.id}`,
            {
                name,
                no_telp: phone,
                email,
                address,
                note,
                is_active: isActive,
            },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Berhasil",
                        description: "Supplier berhasil diperbarui.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Edit Supplier - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <TruckOutlined style={{ marginRight: 8 }} />
                            EDIT SUPPLIER
                        </Title>
                    }
                    extra={
                        <Link href="/account/suppliers">
                            <Button icon={<ArrowLeftOutlined />}>
                                KEMBALI
                            </Button>
                        </Link>
                    }
                >
                    <form onSubmit={updateSupplier}>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Nama Supplier"
                                    validateStatus={errors.name ? "error" : ""}
                                    help={errors.name}
                                    required
                                >
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Nomor Telepon"
                                    validateStatus={
                                        errors.no_telp ? "error" : ""
                                    }
                                    help={errors.no_telp}
                                    required
                                >
                                    <Input
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Email"
                            validateStatus={errors.email ? "error" : ""}
                            help={errors.email}
                        >
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Alamat"
                            validateStatus={errors.address ? "error" : ""}
                            help={errors.address}
                            required
                        >
                            <TextArea
                                rows={3}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Catatan"
                            validateStatus={errors.note ? "error" : ""}
                            help={errors.note}
                        >
                            <TextArea
                                rows={3}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item label="Supplier aktif">
                            <Switch
                                checked={isActive}
                                onChange={setIsActive}
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={saving}
                        >
                            PERBARUI
                        </Button>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
