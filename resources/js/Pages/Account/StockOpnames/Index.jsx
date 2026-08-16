import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND } from "../../../theme/colors";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Space,
    Spin,
    Table,
    Typography,
} from "antd";
import {
    AuditOutlined,
    EyeOutlined,
    FilterOutlined,
    PlusCircleOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const differenceType = (difference) => {
    if (difference > 0) return "success";
    if (difference < 0) return "danger";
    return "secondary";
};

export default function StockOpnameIndex() {
    const {
        stockOpnames,
        filters = {},
        flash = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();

    const [search, setSearch] = useState(filters.q || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/stock-opnames", {
            q: search,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleReset = () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const formatDate = (date) =>
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        setSearch("");
        setStartDate(formatDate(monthStart));
        setEndDate(formatDate(now));

        router.get("/account/stock-opnames");
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (stockOpnames.current_page - 1) * stockOpnames.per_page,
        },
        {
            title: "Kode",
            dataIndex: "code",
            render: (value) => (
                <Text strong style={{ color: BRAND.primary }}>
                    {value}
                </Text>
            ),
        },
        {
            title: "Tanggal",
            dataIndex: "opname_date",
            render: (value) =>
                new Date(value).toLocaleDateString("id-ID"),
        },
        {
            title: "Pemeriksa",
            render: (_, record) => record.user?.name || "-",
        },
        {
            title: "Item",
            align: "center",
            dataIndex: "total_items",
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Total Selisih",
            align: "center",
            dataIndex: "total_difference_qty",
            render: (value) => (
                <Text strong type={differenceType(value)}>
                    {value > 0 ? `+${value}` : value}
                </Text>
            ),
        },
        {
            title: "Catatan",
            dataIndex: "note",
            render: (value) => value || "-",
        },
        {
            title: "Aksi",
            width: 100,
            align: "center",
            render: (_, record) =>
                hasAnyPermission(["stock_opnames.show"], permissions) ? (
                    <Link href={`/account/stock-opnames/${record.code}`}>
                        <Button size="small" icon={<EyeOutlined />}>
                            Detail
                        </Button>
                    </Link>
                ) : null,
        },
    ];

    return (
        <>
            <Head>
                <title>Stock Opname - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <AuditOutlined
                                    style={{ color: BRAND.primary }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    STOCK OPNAME
                                </Title>
                            </Space>
                        }
                        extra={
                            hasAnyPermission(
                                ["stock_opnames.create"],
                                permissions,
                            ) && (
                                <Link href="/account/stock-opnames/create">
                                    <Button
                                        type="primary"
                                        icon={<PlusCircleOutlined />}
                                    >
                                        BUAT OPNAME
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

                        <form onSubmit={handleFilter} style={{ marginBottom: 16 }}>
                            <Row gutter={[12, 12]}>
                                <Col xs={24} md={10}>
                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari kode opname, catatan, atau pengguna..."
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={5}>
                                    <DatePicker
                                        style={{ width: "100%" }}
                                        placeholder="Dari tanggal"
                                        format="YYYY-MM-DD"
                                        value={
                                            startDate
                                                ? dayjs(startDate)
                                                : null
                                        }
                                        onChange={(_, dateString) =>
                                            setStartDate(dateString)
                                        }
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={5}>
                                    <DatePicker
                                        style={{ width: "100%" }}
                                        placeholder="Sampai tanggal"
                                        format="YYYY-MM-DD"
                                        value={
                                            endDate ? dayjs(endDate) : null
                                        }
                                        onChange={(_, dateString) =>
                                            setEndDate(dateString)
                                        }
                                    />
                                </Col>
                                <Col xs={24} md={4}>
                                    <Space>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<FilterOutlined />}
                                        >
                                            Terapkan
                                        </Button>
                                        <Button
                                            icon={<ReloadOutlined />}
                                            onClick={handleReset}
                                        >
                                            Reset
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </form>

                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={stockOpnames.data}
                            pagination={false}
                            scroll={{ x: "max-content" }}
                            locale={{
                                emptyText:
                                    "Belum ada data stock opname. Buat opname pertama untuk mencatat hasil hitung fisik.",
                            }}
                        />

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={stockOpnames.links}
                                align="end"
                                meta={{
                                    current_page: stockOpnames.current_page,
                                    per_page: stockOpnames.per_page,
                                    total: stockOpnames.total,
                                }}
                            />
                        </div>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
