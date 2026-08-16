import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import { Button, Card, Image, Space, Table, Typography } from "antd";
import { EditOutlined, FolderOutlined, PlusOutlined } from "@ant-design/icons";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";

const { Title } = Typography;

export default function CategoryIndex() {
    const { categories, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};

    const columns = [
        {
            title: "No.",
            width: 70,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (categories.current_page - 1) * categories.per_page,
        },
        {
            title: "Gambar",
            width: 100,
            align: "center",
            render: (_, category) =>
                category.image ? (
                    <Image
                        src={category.image}
                        width={50}
                        height={50}
                        className="rounded-3 object-fit-cover"
                        alt={category.name}
                        preview={false}
                    />
                ) : (
                    <div
                        className="d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-muted"
                        style={{ width: 50, height: 50 }}
                    >
                        <FolderOutlined />
                    </div>
                ),
        },
        {
            title: "Nama Kategori",
            dataIndex: "name",
        },
        {
            title: "Aksi",
            width: 120,
            align: "center",
            render: (_, category) => (
                <Space>
                    {hasAnyPermission(["categories.edit"], permissions) && (
                        <Link href={`/account/categories/${category.id}/edit`}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["categories.delete"], permissions) && (
                        <Delete
                            URL="/account/categories"
                            id={category.id}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Kategori - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <FolderOutlined style={{ marginRight: 8 }} />
                            KATEGORI
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["categories.create"], permissions) && (
                            <Link href="/account/categories/create">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                >
                                    TAMBAH KATEGORI
                                </Button>
                            </Link>
                        )
                    }
                >
                    <div style={{ marginBottom: 16 }}>
                        <Search URL="/account/categories" />
                    </div>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={categories.data}
                        pagination={false}
                        locale={{ emptyText: "Data belum tersedia!" }}
                    />

                    <Pagination
                        links={categories.links}
                        meta={categories}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
