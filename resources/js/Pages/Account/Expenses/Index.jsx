import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Table,
    Typography,
} from "antd";
import {
    EditOutlined,
    FilterOutlined,
    PlusOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
        dateStyle: "medium",
    });
};

const formatLinesSummary = (record) => {
    const count = record.lines_count || 0;
    const labels = record.category_labels || [];
    const labelText = labels.length > 0 ? labels.join(", ") : "-";

    return `${count} baris · ${labelText}`;
};

export default function ExpenseIndex() {
    const {
        expenses,
        summary = {},
        filters = {},
        categories = [],
        users = [],
        isAdmin = false,
        auth = {},
    } = usePage().props;

    const permissions = auth.permissions || {};
    const loading = useInertiaLoading();

    const [search, setSearch] = useState(filters.q || "");
    const [category, setCategory] = useState(filters.category || undefined);
    const [dateRange, setDateRange] = useState(
        filters.start_date && filters.end_date
            ? [dayjs(filters.start_date), dayjs(filters.end_date)]
            : null,
    );
    const [userId, setUserId] = useState(filters.user_id || undefined);

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/expenses", {
            q: search,
            category: category || "",
            start_date: dateRange?.[0]?.format("YYYY-MM-DD") || "",
            end_date: dateRange?.[1]?.format("YYYY-MM-DD") || "",
            user_id: userId || "",
        });
    };

    const handleReset = () => {
        setSearch("");
        setCategory(undefined);
        setDateRange(null);
        setUserId(undefined);
        router.get("/account/expenses");
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (expenses.current_page - 1) * expenses.per_page,
        },
        {
            title: "Tanggal",
            dataIndex: "expense_date",
            render: (value) => formatDate(value),
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
            title: "Ringkasan Baris",
            render: (_, record) => (
                <Text type="secondary">{formatLinesSummary(record)}</Text>
            ),
        },
        {
            title: "Total",
            align: "right",
            dataIndex: "amount",
            render: (value) => (
                <Text strong style={{ color: "var(--semantic-error)" }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
        {
            title: "Kasir",
            render: (_, record) => record.user?.name || "-",
        },
        {
            title: "Aksi",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space>
                    {hasAnyPermission(["expenses.edit"], permissions) && (
                        <Link href={`/account/expenses/${record.id}/edit`}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["expenses.delete"], permissions) && (
                        <Delete URL="/account/expenses" id={record.id} />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>Pengeluaran - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Title level={4} style={{ margin: 0 }}>
                                PENGELUARAN
                            </Title>
                        }
                        extra={
                            hasAnyPermission(
                                ["expenses.create"],
                                permissions,
                            ) && (
                                <Link href="/account/expenses/create">
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                    >
                                        TAMBAH PENGELUARAN
                                    </Button>
                                </Link>
                            )
                        }
                    >
                        <form
                            onSubmit={handleFilter}
                            style={{ marginBottom: 16 }}
                        >
                            <Row gutter={[12, 12]}>
                                <Col xs={24} lg={6}>
                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari kode, judul, atau catatan..."
                                    />
                                </Col>
                                <Col xs={24} sm={12} lg={4}>
                                    <Select
                                        allowClear
                                        placeholder="Semua Kategori"
                                        style={{ width: "100%" }}
                                        value={category}
                                        onChange={setCategory}
                                        options={categories.map((item) => ({
                                            value: item.value,
                                            label: item.label,
                                        }))}
                                    />
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <RangePicker
                                        style={{ width: "100%" }}
                                        format="DD/MM/YYYY"
                                        placeholder={[
                                            "Dari tanggal",
                                            "Sampai tanggal",
                                        ]}
                                        value={dateRange}
                                        onChange={setDateRange}
                                    />
                                </Col>
                                {isAdmin && (
                                    <Col xs={24} sm={12} lg={4}>
                                        <Select
                                            allowClear
                                            placeholder="Semua Kasir"
                                            style={{ width: "100%" }}
                                            value={userId}
                                            onChange={setUserId}
                                            options={users.map((user) => ({
                                                value: String(user.id),
                                                label: user.name,
                                            }))}
                                        />
                                    </Col>
                                )}
                                <Col xs={24} lg={isAdmin ? 4 : 8}>
                                    <Space>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<FilterOutlined />}
                                        />
                                        <Button
                                            icon={<ReloadOutlined />}
                                            onClick={handleReset}
                                        />
                                    </Space>
                                </Col>
                            </Row>
                        </form>

                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col xs={24} md={12}>
                                <Card size="small">
                                    <Statistic
                                        title="Total Pengeluaran"
                                        value={summary.total_amount || 0}
                                        formatter={(value) =>
                                            formatRupiah(value)
                                        }
                                        valueStyle={{
                                            color: "var(--semantic-error)",
                                        }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card size="small">
                                    <Statistic
                                        title="Jumlah Transaksi"
                                        value={summary.total_expenses || 0}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={expenses.data}
                            pagination={false}
                            scroll={{ x: "max-content" }}
                            locale={{
                                emptyText:
                                    "Data pengeluaran belum tersedia. Catat pengeluaran pertama untuk mulai melacak biaya.",
                            }}
                        />

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={expenses.links}
                                align="end"
                                meta={{
                                    current_page: expenses.current_page,
                                    per_page: expenses.per_page,
                                    total: expenses.total,
                                }}
                            />
                        </div>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
