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
    SafetyCertificateOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import getRoleLabel from "../../../Utils/role";

const { Title } = Typography;

export default function RoleEdit() {
    const {
        errors = {},
        permissions = [],
        role,
        isSystemRole = false,
    } = usePage().props;

    const [name, setName] = useState(role.name);
    const [permissionsData, setPermissionsData] = useState(
        role.permissions.map((permission) => permission.name),
    );
    const [saving, setSaving] = useState(false);

    const updateRole = (e) => {
        e.preventDefault();
        setSaving(true);

        router.put(
            `/account/roles/${role.id}`,
            {
                name,
                permissions: permissionsData,
            },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Berhasil",
                        description: "Role berhasil diperbarui.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Edit Role - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <SafetyCertificateOutlined
                                style={{ marginRight: 8 }}
                            />
                            EDIT ROLE
                        </Title>
                    }
                    extra={
                        <Link href="/account/roles">
                            <Button icon={<ArrowLeftOutlined />}>KEMBALI</Button>
                        </Link>
                    }
                >
                    <form onSubmit={updateRole}>
                        <Form.Item
                            label="Nama Role"
                            validateStatus={errors.name ? "error" : ""}
                            help={
                                errors.name ||
                                (isSystemRole
                                    ? `Nama database: ${name}. Role sistem dikunci agar konsisten.`
                                    : undefined)
                            }
                            required
                        >
                            <Input
                                value={
                                    isSystemRole ? getRoleLabel(name) : name
                                }
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masukkan nama role"
                                disabled={isSystemRole}
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
