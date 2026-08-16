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
    Space,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    ReloadOutlined,
    SaveOutlined,
    UserAddOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

export default function CustomerCreate() {
    const { errors = {} } = usePage().props;

    const [name, setName] = useState("");
    const [noTelp, setNoTelp] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [saving, setSaving] = useState(false);

    const storeCustomer = (e) => {
        e.preventDefault();
        setSaving(true);

        router.post(
            "/account/customers",
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
                        description: "Pelanggan berhasil ditambahkan.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    const resetForm = () => {
        setName("");
        setNoTelp("");
        setEmail("");
        setAddress("");
    };

    return (
        <>
            <Head title="Tambah Pelanggan - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <UserAddOutlined style={{ marginRight: 8 }} />
                            TAMBAH PELANGGAN
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
                    <form onSubmit={storeCustomer}>
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

                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={saving}
                            >
                                SIMPAN
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={resetForm}
                            >
                                ATUR ULANG
                            </Button>
                        </Space>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
