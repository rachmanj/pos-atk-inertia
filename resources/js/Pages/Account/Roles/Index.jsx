import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import { Button, Card, Space, Table, Tag, Typography } from "antd";
import {
    EditOutlined,
    PlusOutlined,
    SafetyOutlined,
} from "@ant-design/icons";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import getRoleLabel from "../../../Utils/role";

const { Title, Text } = Typography;

export default function RoleIndex() {
    const { roles, auth = {} } = usePage().props;
    const allPermissions = auth.permissions || {};

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (roles.current_page - 1) * roles.per_page,
        },
        {
            title: "Nama Role",
            render: (_, role) => (
                <>
                    <Text strong>{getRoleLabel(role.name)}</Text>
                    {role.is_system && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Role sistem: {role.name}
                            </Text>
                        </div>
                    )}
                </>
            ),
        },
        {
            title: "Hak Akses",
            width: 140,
            align: "center",
            render: (_, role) => (
                <Tag color="green">
                    {role.permissions.length} permission
                </Tag>
            ),
        },
        {
            title: "Aksi",
            width: 120,
            align: "center",
            render: (_, role) => (
                <Space>
                    {hasAnyPermission(["roles.edit"], allPermissions) && (
                        <Link href={`/account/roles/${role.id}/edit`}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["roles.delete"], allPermissions) &&
                        !role.is_system && (
                            <Delete URL="/account/roles" id={role.id} />
                        )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Role - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <SafetyOutlined style={{ marginRight: 8 }} />
                            ROLE
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["roles.create"], allPermissions) && (
                            <Link href="/account/roles/create">
                                <Button type="primary" icon={<PlusOutlined />}>
                                    TAMBAH ROLE
                                </Button>
                            </Link>
                        )
                    }
                >
                    <div style={{ marginBottom: 16 }}>
                        <Search URL="/account/roles" />
                    </div>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={roles.data}
                        pagination={false}
                        locale={{ emptyText: "Data belum tersedia!" }}
                    />

                    <Pagination links={roles.links} meta={roles} align="end" />
                </Card>
            </LayoutAccount>
        </>
    );
}
