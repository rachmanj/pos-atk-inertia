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
    PlusCircleOutlined,
    ReloadOutlined,
    SaveOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function RoleCreate() {
    const { errors = {}, permissions = [] } = usePage().props;

    const [name, setName] = useState("");
    const [permissionsData, setPermissionsData] = useState([]);
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setName("");
        setPermissionsData([]);
    };

    const storeRole = (e) => {
        e.preventDefault();
        setSaving(true);

        router.post(
            "/account/roles",
            {
                name,
                permissions: permissionsData,
            },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Berhasil",
                        description: "Role berhasil ditambahkan.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Tambah Role - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <PlusCircleOutlined style={{ marginRight: 8 }} />
                            TAMBAH ROLE
                        </Title>
                    }
                    extra={
                        <Link href="/account/roles">
                            <Button icon={<ArrowLeftOutlined />}>KEMBALI</Button>
                        </Link>
                    }
                >
                    <form onSubmit={storeRole}>
                        <Form.Item
                            label="Nama Role"
                            validateStatus={errors.name ? "error" : ""}
                            help={errors.name}
                            required
                        >
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masukkan nama role"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Hak Akses"
                            validateStatus={errors.permissions ? "error" : ""}
                            help={errors.permissions}
                            required
                        >
                            <Checkbox.Group
                                value={permissionsData}
                                onChange={setPermissionsData}
                                style={{ width: "100%" }}
                            >
                                <Row gutter={[8, 8]}>
                                    {permissions.map((permission) => (
                                        <Col
                                            key={permission.id}
                                            xs={24}
                                            sm={12}
                                            md={8}
                                            lg={6}
                                        >
                                            <Checkbox value={permission.name}>
                                                {permission.name}
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
