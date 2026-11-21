import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { formatDateOnly } from "../../../Utils/format";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Grid,
    List,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    EyeOutlined,
    FilterOutlined,
    InboxOutlined,
    PlusOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const statusLabel = (status) => (status === "closed" ? "Ditutup" : "Aktif");
const statusColor = (status) => (status === "closed" ? "default" : "processing");

export default function ConsignmentIndex() {
    const {
        consignments,
        suppliers = [],
        filters = {},
        flash = {},
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [supplierId, setSupplierId] = useState(
        filters.supplier_id || undefined,
    );
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/consignments", {
            supplier_id: supplierId || "",
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleReset = () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const formatDate = (date) =>
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        setSupplierId(undefined);
        setStartDate(formatDate(monthStart));
        setEndDate(formatDate(now));
        router.get("/account/consignments");
    };

    const columns = [
        {
            title: "No.",
            width: 56,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (consignments.current_page - 1) * consignments.per_page,
        },
        {
            title: "Kode",
            dataIndex: "code",
            render: (value) => (
                <Text strong style={{ color: "var(--brand-primary)" }}>
                    {value}
                </Text>
            ),
        },
        {
            title: "Tanggal",
            dataIndex: "received_date",
            responsive: ["sm"],
            render: (value) => formatDateOnly(value),
        },
        {
            title: "Supplier",
            render: (_, record) => record.supplier?.name || "-",
        },
        {
            title: "Item",
            align: "center",
            dataIndex: "items_count",
            width: 72,
            render: (value) => <Text strong>{value ?? 0}</Text>,
        },
        {
            title: "Total Qty",
            align: "center",
            dataIndex: "total_qty",
            width: 88,
            responsive: ["md"],
            render: (value) => <Text strong>{value ?? 0}</Text>,
        },
        {
            title: "Status",
            align: "center",
            dataIndex: "status",
            width: 88,
            render: (value) => (
                <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>
            ),
        },
        {
            title: "Aksi",
            width: 96,
            align: "center",
            render: (_, record) =>
                hasAnyPermission(["consignments.show"], permissions) ? (
                    <Link href={`/account/consignments/${record.id}`}>
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
                <title>Konsinyasi - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <InboxOutlined
                                    style={{ color: "var(--brand-primary)" }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    PENERIMAAN KONSINYASI
                                </Title>
                            </Space>
                        }
                        extra={
                            hasAnyPermission(
                                ["consignments.create"],
                                permissions,
                            ) && (
                                <Link href="/account/consignments/create">
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                    >
                                        TAMBAH
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

                        <form
                            onSubmit={handleFilter}
                            style={{ marginBottom: 16 }}
                        >
                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12} md={8}>
                                    <Select
                                        allowClear
                                        placeholder="Semua Supplier"
                                        style={{ width: "100%" }}
                                        value={supplierId}
                                        onChange={setSupplierId}
                                        options={suppliers.map((supplier) => ({
                                            value: String(supplier.id),
                                            label: supplier.name,
                                        }))}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={6}>
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
                                <Col xs={24} sm={12} md={6}>
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
                                    <Space wrap>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<FilterOutlined />}
                                        >
                                            Filter
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

                        {isMobile ? (
                            <List
                                dataSource={consignments.data}
                                locale={{
                                    emptyText:
                                        "Belum ada penerimaan konsinyasi. Mulai dengan menambah penerimaan baru.",
                                }}
                                renderItem={(record) => (
                                    <List.Item
                                        key={record.id}
                                        actions={[
                                            hasAnyPermission(
                                                ["consignments.show"],
                                                permissions,
                                            ) ? (
                                                <Link
                                                    href={`/account/consignments/${record.id}`}
                                                >
                                                    <Button
                                                        size="small"
                                                        icon={<EyeOutlined />}
                                                    >
                                                        Detail
                                                    </Button>
                                                </Link>
                                            ) : null,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <Space wrap>
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: "var(--brand-primary)",
                                                        }}
                                                    >
                                                        {record.code}
                                                    </Text>
                                                    <Tag
                                                        color={statusColor(
                                                            record.status,
                                                        )}
                                                    >
                                                        {statusLabel(
                                                            record.status,
                                                        )}
                                                    </Tag>
                                                </Space>
                                            }
                                            description={
                                                <Space
                                                    direction="vertical"
                                                    size={2}
                                                >
                                                    <Text>
                                                        {record.supplier
                                                            ?.name || "-"}
                                                    </Text>
                                                    <Text type="secondary">
                                                        {formatDateOnly(
                                                            record.received_date,
                                                        )}{" "}
                                                        · {record.items_count ??
                                                            0}{" "}
                                                        item ·{" "}
                                                        {record.total_qty ?? 0}{" "}
                                                        qty
                                                    </Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={consignments.data}
                                pagination={false}
                                locale={{
                                    emptyText:
                                        "Belum ada penerimaan konsinyasi. Mulai dengan menambah penerimaan baru.",
                                }}
                            />
                        )}

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={consignments.links}
                                align="end"
                                meta={{
                                    current_page: consignments.current_page,
                                    per_page: consignments.per_page,
                                    total: consignments.total,
                                }}
                            />
                        </div>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}