import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import {
    Button,
    Card,
    Checkbox,
    Col,
    Form,
    Input,
    InputNumber,
    Row,
    Space,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UserOutlined,
} from "@ant-design/icons";
import getRoleLabel from "../../../Utils/role";

const { Title } = Typography;

export default function UserEdit() {
    const { errors = {}, roles, user } = usePage().props;

    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [telegramId, setTelegramId] = useState(user.telegram_id ?? null);
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [rolesData, setRolesData] = useState(
        user.roles.map((obj) => obj.name),
    );
    const [saving, setSaving] = useState(false);

    const updateUser = (e) => {
        e.preventDefault();
        setSaving(true);

        router.put(
            `/account/users/${user.id}`,
            {
                name,
                username,
                email,
                telegram_id: telegramId,
                password,
                password_confirmation: passwordConfirmation,
                roles: rolesData,
            },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Berhasil",
                        description: "Pengguna berhasil diperbarui.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Edit Pengguna - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <UserOutlined style={{ marginRight: 8 }} />
                            EDIT PENGGUNA
                        </Title>
                    }
                    extra={
                        <Link href="/account/users">
                            <Button icon={<ArrowLeftOutlined />}>KEMBALI</Button>
                        </Link>
                    }
                >
                    <form onSubmit={updateUser}>
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
                                        placeholder="Masukkan nama lengkap"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Username"
                                    validateStatus={
                                        errors.username ? "error" : ""
                                    }
                                    help={errors.username}
                                    required
                                >
                                    <Input
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                        placeholder="Masukkan username"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Alamat Email"
                                    validateStatus={errors.email ? "error" : ""}
                                    help={errors.email}
                                    required
                                >
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Masukkan alamat email"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Telegram ID"
                                    validateStatus={
                                        errors.telegram_id ? "error" : ""
                                    }
                                    help={
                                        errors.telegram_id ||
                                        "ID numerik dari akun Telegram pengguna untuk integrasi bot."
                                    }
                                >
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        value={telegramId}
                                        onChange={setTelegramId}
                                        placeholder="Contoh: 123456789"
                                        controls={false}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Kata Sandi"
                                    validateStatus={
                                        errors.password ? "error" : ""
                                    }
                                    help={errors.password}
                                >
                                    <Input.Password
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Kosongkan jika tidak ingin diubah"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Konfirmasi Kata Sandi">
                                    <Input.Password
                                        value={passwordConfirmation}
                                        onChange={(e) =>
                                            setPasswordConfirmation(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Kosongkan jika tidak ingin diubah"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Pilih Role"
                            validateStatus={errors.roles ? "error" : ""}
                            help={errors.roles}
                            required
                        >
                            <Checkbox.Group
                                value={rolesData}
                                onChange={setRolesData}
                                style={{ width: "100%" }}
                            >
                                <Row gutter={[8, 8]}>
                                    {roles.map((role) => (
                                        <Col
                                            key={role.id}
                                            xs={24}
                                            sm={12}
                                            md={8}
                                            lg={6}
                                        >
                                            <Checkbox value={role.name}>
                                                {getRoleLabel(role.name)}
                                            </Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
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
