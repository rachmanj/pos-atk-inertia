import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import { Button, Card, Space, Table, Typography } from "antd";
import {
    EditOutlined,
    PlusOutlined,
    BlockOutlined,
} from "@ant-design/icons";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";

const { Title } = Typography;

export default function UnitIndex() {
    const { units, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};

    const columns = [
        {
            title: "No.",
            width: 70,
            render: (_, __, index) => units.from + index,
        },
        {
            title: "Nama",
            dataIndex: "name",
        },
        {
            title: "Singkatan",
            dataIndex: "abbreviation",
        },
        {
            title: "Aksi",
            width: 120,
            render: (_, unit) => (
                <Space>
                    {hasAnyPermission(["units.edit"], permissions) && (
                        <Link href={`/account/units/${unit.id}/edit`}>
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["units.delete"], permissions) && (
                        <Delete URL={`/account/units/${unit.id}`} />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Satuan - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <BlockOutlined style={{ marginRight: 8 }} />
                            SATUAN
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["units.create"], permissions) && (
                            <Link href="/account/units/create">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                >
                                    TAMBAH SATUAN
                                </Button>
                            </Link>
                        )
                    }
                >
                    <div style={{ marginBottom: 16 }}>
                        <Search URL="/account/units" />
                    </div>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={units.data}
                        pagination={false}
                        locale={{ emptyText: "Belum ada data satuan." }}
                    />

                    <Pagination links={units.links} meta={units} />
                </Card>
            </LayoutAccount>
        </>
    );
}
