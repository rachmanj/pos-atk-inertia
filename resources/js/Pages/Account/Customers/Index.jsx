import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import { Button, Card, Space, Table, Typography } from "antd";
import {
    EditOutlined,
    IdcardOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";

const { Title } = Typography;

export default function CustomerIndex() {
    const { customers, auth } = usePage().props;
    const permissions = auth?.permissions || {};

    const columns = [
        {
            title: "No.",
            width: 70,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (customers.current_page - 1) * customers.per_page,
        },
        {
            title: "Nama Lengkap",
            dataIndex: "name",
            render: (value) => <strong>{value}</strong>,
        },
        {
            title: "Nomor Telepon",
            dataIndex: "no_telp",
        },
        {
            title: "Email",
            dataIndex: "email",
            render: (value) => value || "-",
        },
        {
            title: "Alamat",
            dataIndex: "address",
        },
        {
            title: "Aksi",
            width: 120,
            align: "center",
            render: (_, customer) => (
                <Space>
                    {hasAnyPermission(["customers.edit"], permissions) && (
                        <Link href={`/account/customers/${customer.id}/edit`}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["customers.delete"], permissions) && (
                        <Delete
                            URL="/account/customers"
                            id={customer.id}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Pelanggan - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <IdcardOutlined style={{ marginRight: 8 }} />
                            PELANGGAN
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["customers.create"], permissions) && (
                            <Link href="/account/customers/create">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                >
                                    TAMBAH PELANGGAN
                                </Button>
                            </Link>
                        )
                    }
                >
                    <div style={{ marginBottom: 16 }}>
                        <Search URL="/account/customers" />
                    </div>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={customers.data}
                        pagination={false}
                        locale={{ emptyText: "Data belum tersedia!" }}
                    />

                    <Pagination
                        links={customers.links}
                        meta={customers}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
