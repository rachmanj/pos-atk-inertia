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
import getRoleLabel from "../../../Utils/role";

const { Title } = Typography;

export default function UserCreate() {
    const { errors = {}, roles = [] } = usePage().props;

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [rolesData, setRolesData] = useState([]);
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        setRolesData([]);
    };

    const storeUser = (e) => {
        e.preventDefault();
        setSaving(true);

        router.post(
            "/account/users",
            {
                name,
                username,
                email,
                password,
                password_confirmation: passwordConfirmation,
                roles: rolesData,
            },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Berhasil",
                        description: "Pengguna berhasil ditambahkan.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Tambah Pengguna - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <UserAddOutlined style={{ marginRight: 8 }} />
                            TAMBAH PENGGUNA
                        </Title>
                    }
                    extra={
                        <Link href="/account/users">
                            <Button icon={<ArrowLeftOutlined />}>KEMBALI</Button>
                        </Link>
                    }
                >
                    <form onSubmit={storeUser}>
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
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Kata Sandi"
                                    validateStatus={
                                        errors.password ? "error" : ""
                                    }
                                    help={errors.password}
                                    required
                                >
                                    <Input.Password
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Masukkan kata sandi"
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
                                        placeholder="Masukkan konfirmasi kata sandi"
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
