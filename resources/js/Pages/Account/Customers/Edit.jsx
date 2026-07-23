import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UserOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

export default function CustomerEdit() {
    const { errors = {}, customer } = usePage().props;

    const [name, setName] = useState(customer.name);
    const [noTelp, setNoTelp] = useState(customer.no_telp);
    const [email, setEmail] = useState(customer.email || "");
    const [address, setAddress] = useState(customer.address);
    const [saving, setSaving] = useState(false);

    const updateCustomer = (e) => {
        e.preventDefault();
        setSaving(true);

        router.put(
            `/account/customers/${customer.id}`,
            {
                name,
                no_telp: noTelp,
                email,
                address,
            },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Berhasil",
                        description: "Pelanggan berhasil diperbarui.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Edit Pelanggan - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <UserOutlined style={{ marginRight: 8 }} />
                            EDIT PELANGGAN
                        </Title>
                    }
                    extra={
                        <Link href="/account/customers">
                            <Button icon={<ArrowLeftOutlined />}>
                                KEMBALI
                            </Button>
                        </Link>
                    }
                >
                    <form onSubmit={updateCustomer}>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Nama Lengkap"
                                    validateStatus={errors.name ? "error" : ""}
                                    help={errors.name}
                                    required
                                >
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Masukkan nama pelanggan"
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
                                        value={noTelp}
                                        onChange={(e) =>
                                            setNoTelp(e.target.value)
                                        }
                                        placeholder="Masukkan nomor telepon (08...)"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Email (Opsional)"
                            validateStatus={errors.email ? "error" : ""}
                            help={errors.email}
                        >
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Masukkan alamat email"
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
                                placeholder="Masukkan alamat lengkap"
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
