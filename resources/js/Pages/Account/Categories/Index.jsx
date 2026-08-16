import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import { Button, Card, Image, Space, Spin, Table, Typography } from "antd";
import { EditOutlined, FolderOutlined, PlusOutlined } from "@ant-design/icons";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, NEUTRAL } from "../../../theme/colors";

const { Title } = Typography;

export default function CategoryIndex() {
    const { categories, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();

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
                        style={{
                            borderRadius: 8,
                            objectFit: "cover",
                        }}
                        alt={category.name}
                        preview={false}
                    />
                ) : (
                    <div
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 8,
                            background: NEUTRAL.slate50,
                            color: NEUTRAL.slate400,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
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
            <Head>
                <title>Kategori - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <FolderOutlined
                                    style={{ color: BRAND.primary }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    KATEGORI
                                </Title>
                            </Space>
                        }
                        extra={
                            hasAnyPermission(
                                ["categories.create"],
                                permissions,
                            ) && (
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
                            scroll={{ x: "max-content" }}
                            locale={{
                                emptyText:
                                    "Belum ada kategori. Tambahkan kategori pertama untuk mengelompokkan produk.",
                            }}
                        />

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={categories.links}
                                meta={categories}
                                align="end"
                            />
                        </div>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
