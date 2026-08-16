import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Button, Card, Col, Input, Row, Space, Table, Tag, Typography } from "antd";
import {
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    TruckOutlined,
} from "@ant-design/icons";
import Pagination from "../../../Shared/Pagination";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";

const { Title } = Typography;

export default function SupplierIndex() {
    const { suppliers, filters, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};
    const [search, setSearch] = useState(filters.q || "");
    const [searching, setSearching] = useState(false);

    const handleSearch = () => {
        setSearching(true);
        router.get(
            "/account/suppliers",
            { q: search },
            { onFinish: () => setSearching(false) },
        );
    };

    const handleReset = () => {
        setSearch("");
        router.get("/account/suppliers");
    };

    const columns = [
        {
            title: "No.",
            width: 70,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (suppliers.current_page - 1) * suppliers.per_page,
        },
        {
            title: "Nama Supplier",
            dataIndex: "name",
            render: (value) => <strong>{value}</strong>,
        },
        {
            title: "Telepon",
            dataIndex: "no_telp",
            render: (value) => value || "-",
        },
        {
            title: "Email",
            dataIndex: "email",
            render: (value) => value || "-",
        },
        {
            title: "Alamat",
            dataIndex: "address",
            render: (value) => value || "-",
        },
        {
            title: "Status",
            dataIndex: "is_active",
            render: (isActive) => (
                <Tag color={isActive ? "success" : "default"}>
                    {isActive ? "Aktif" : "Nonaktif"}
                </Tag>
            ),
        },
        {
            title: "Aksi",
            width: 120,
            align: "center",
            render: (_, supplier) => (
                <Space>
                    {hasAnyPermission(["suppliers.edit"], permissions) && (
                        <Link href={`/account/suppliers/${supplier.id}/edit`}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["suppliers.delete"], permissions) && (
                        <Delete
                            URL="/account/suppliers"
                            id={supplier.id}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Supplier - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <TruckOutlined style={{ marginRight: 8 }} />
                            SUPPLIER
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["suppliers.create"], permissions) && (
                            <Link href="/account/suppliers/create">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                >
                                    TAMBAH SUPPLIER
                                </Button>
                            </Link>
                        )
                    }
                >
                    <Row gutter={8} style={{ marginBottom: 16 }}>
                        <Col xs={24} md={16}>
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onPressEnter={handleSearch}
                                placeholder="Cari nama supplier, telepon, atau email..."
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Space style={{ width: "100%" }}>
                                <Button
                                    type="primary"
                                    icon={<SearchOutlined />}
                                    onClick={handleSearch}
                                    loading={searching}
                                    style={{ flex: 1 }}
                                >
                                    Cari
                                </Button>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={handleReset}
                                    style={{ flex: 1 }}
                                >
                                    Reset
                                </Button>
                            </Space>
                        </Col>
                    </Row>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={suppliers.data}
                        pagination={false}
                        locale={{
                            emptyText:
                                "Belum ada supplier. Tambahkan supplier pertama untuk mulai membuat pembelian.",
                        }}
                    />

                    <Pagination
                        links={suppliers.links}
                        meta={suppliers}
                        align="end"
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
