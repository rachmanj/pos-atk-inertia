import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link, router } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND } from "../../../theme/colors";
import {
    Alert,
    Button,
    Card,
    Col,
    Input,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    FilterOutlined,
    AppstoreOutlined,
    PlusOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const typeOptions = [
    { value: "", label: "Semua Tipe" },
    { value: "in", label: "Masuk" },
    { value: "out", label: "Keluar" },
    { value: "adjustment", label: "Koreksi" },
];

const typeColors = {
    in: "success",
    out: "error",
    adjustment: "processing",
};

const typeLabels = {
    in: "MASUK",
    out: "KELUAR",
    adjustment: "KOREKSI",
};

const getStockDelta = (movement) =>
    Number(movement.stock_after ?? 0) - Number(movement.stock_before ?? 0);

const formatStockDelta = (movement) => {
    const delta = getStockDelta(movement);
    return delta > 0 ? `+${delta}` : String(delta);
};

export default function StockMovementIndex() {
    const { stockMovements, filters, flash, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();

    const [search, setSearch] = useState(filters.q || "");
    const [type, setType] = useState(filters.type || undefined);

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/stock-movements", {
            q: search,
            type: type || "",
        });
    };

    const handleReset = () => {
        setSearch("");
        setType(undefined);
        router.get("/account/stock-movements");
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (stockMovements.current_page - 1) *
                    stockMovements.per_page,
        },
        {
            title: "Tanggal",
            dataIndex: "created_at",
            render: (value) =>
                new Date(value).toLocaleString("id-ID"),
        },
        {
            title: "Produk",
            render: (_, record) => (
                <>
                    <Text strong>{record.product?.title || "-"}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.product?.barcode || "-"}
                    </Text>
                </>
            ),
        },
        {
            title: "Tipe",
            align: "center",
            dataIndex: "type",
            render: (value) => (
                <Tag color={typeColors[value] || "default"}>
                    {typeLabels[value] || value}
                </Tag>
            ),
        },
        {
            title: "Perubahan",
            align: "center",
            render: (_, record) => {
                const delta = getStockDelta(record);
                return (
                    <Text
                        strong
                        type={
                            delta > 0
                                ? "success"
                                : delta < 0
                                  ? "danger"
                                  : "secondary"
                        }
                    >
                        {formatStockDelta(record)}
                    </Text>
                );
            },
        },
        {
            title: "Sebelum",
            align: "center",
            dataIndex: "stock_before",
        },
        {
            title: "Sesudah",
            align: "center",
            dataIndex: "stock_after",
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Sumber",
            dataIndex: "source_label",
            render: (value) => <Tag>{value}</Tag>,
        },
        {
            title: "Pengguna",
            render: (_, record) => record.user?.name || "-",
        },
        {
            title: "Catatan",
            dataIndex: "note",
            render: (value) => value || "-",
        },
    ];

    return (
        <>
            <Head>
                <title>Mutasi Stok - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <AppstoreOutlined
                                    style={{ color: BRAND.primary }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    MUTASI STOK
                                </Title>
                            </Space>
                        }
                        extra={
                            hasAnyPermission(
                                ["stock_movements.create"],
                                permissions,
                            ) && (
                                <Link href="/account/stock-movements/create">
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                    >
                                        KOREKSI STOK
                                    </Button>
                                </Link>
                            )
                        }
                    >
                        {flash.success && (
                            <Alert
                                type="success"
                                message={flash.success}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        {flash.error && (
                            <Alert
                                type="error"
                                message={flash.error}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <form
                            onSubmit={handleFilter}
                            style={{ marginBottom: 16 }}
                        >
                            <Row gutter={[12, 12]}>
                                <Col xs={24} md={12}>
                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari produk, barcode, pengguna, atau catatan..."
                                    />
                                </Col>
                                <Col xs={24} md={6}>
                                    <Select
                                        allowClear
                                        placeholder="Semua Tipe"
                                        style={{ width: "100%" }}
                                        value={type}
                                        onChange={setType}
                                        options={typeOptions.filter(
                                            (item) => item.value !== "",
                                        )}
                                    />
                                </Col>
                                <Col xs={24} md={6}>
                                    <Space>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<FilterOutlined />}
                                        >
                                            TERAPKAN
                                        </Button>
                                        <Button
                                            icon={<ReloadOutlined />}
                                            onClick={handleReset}
                                        >
                                            ATUR ULANG
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </form>

                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={stockMovements.data}
                            pagination={false}
                            scroll={{ x: "max-content" }}
                            locale={{
                                emptyText:
                                    "Belum ada histori mutasi stok. Koreksi stok atau transaksi akan tercatat di sini.",
                            }}
                        />

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={stockMovements.links}
                                align="end"
                                meta={{
                                    current_page: stockMovements.current_page,
                                    per_page: stockMovements.per_page,
                                    total: stockMovements.total,
                                }}
                            />
                        </div>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
