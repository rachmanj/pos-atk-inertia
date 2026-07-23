import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import { Button, Card, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import getRoleLabel from "../../../Utils/role";

const { Title } = Typography;

export default function UserIndex() {
    const { users, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (users.current_page - 1) * users.per_page,
        },
        {
            title: "Nama Pengguna",
            dataIndex: "name",
        },
        {
            title: "Username",
            dataIndex: "username",
        },
        {
            title: "Alamat Email",
            dataIndex: "email",
        },
        {
            title: "Role",
            render: (_, user) => (
                <Space wrap>
                    {user.roles.map((role) => (
                        <Tag key={role.id} color="blue">
                            {getRoleLabel(role.name)}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: "Status",
            width: 120,
            render: (_, user) => (
                <Tag color={user.telegram_id ? "success" : "default"}>
                    {user.telegram_id ? "Telegram Aktif" : "Belum Terhubung"}
                </Tag>
            ),
        },
        {
            title: "Aksi",
            width: 120,
            align: "center",
            render: (_, user) => (
                <Space>
                    {hasAnyPermission(["users.edit"], permissions) && (
                        <Link href={`/account/users/${user.id}/edit`}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["users.delete"], permissions) && (
                        <Delete URL="/account/users" id={user.id} />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Pengguna - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <TeamOutlined style={{ marginRight: 8 }} />
                            PENGGUNA
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["users.create"], permissions) && (
                            <Link href="/account/users/create">
                                <Button type="primary" icon={<PlusOutlined />}>
                                    TAMBAH PENGGUNA
                                </Button>
                            </Link>
                        )
                    }
                >
                    <div style={{ marginBottom: 16 }}>
                        <Search URL="/account/users" />
                    </div>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={users.data}
                        pagination={false}
                        locale={{ emptyText: "Data belum tersedia!" }}
                        scroll={{ x: 800 }}
                    />

                    <Pagination links={users.links} meta={users} align="end" />
                </Card>
            </LayoutAccount>
        </>
    );
}
