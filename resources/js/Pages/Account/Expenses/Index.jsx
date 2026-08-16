import LayoutAccount from "../../../Layouts/Account";
import Pagination from "../../../Shared/Pagination";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Select,
    Space,
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

const { Title } = Typography;

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

    const [search, setSearch] = useState(filters.q || "");
    const [category, setCategory] = useState(filters.category || undefined);
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [userId, setUserId] = useState(filters.user_id || undefined);

    const categoryLabels = useMemo(() => {
        return categories.reduce((labels, item) => {
            labels[item.value] = item.label;
            return labels;
        }, {});
    }, [categories]);

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/expenses", {
            q: search,
            category: category || "",
            start_date: startDate,
            end_date: endDate,
            user_id: userId || "",
        });
    };

    const handleReset = () => {
        setSearch("");
        setCategory(undefined);
        setStartDate("");
        setEndDate("");
        setUserId(undefined);
        router.get("/account/expenses");
    };

    const formatDate = (value) => {
        if (!value) return "-";
        return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
            dateStyle: "medium",
        });
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
            title: "Kode",
            dataIndex: "code",
            render: (value) => <strong className="text-primary">{value}</strong>,
        },
        {
            title: "Tanggal",
            dataIndex: "expense_date",
            render: (value) => formatDate(value),
        },
        {
            title: "Kategori",
            dataIndex: "category",
            render: (value) => categoryLabels[value] || value,
        },
        {
            title: "Judul",
            dataIndex: "title",
            render: (value) => <strong>{value}</strong>,
        },
        {
            title: "User",
            render: (_, record) => record.user?.name || "-",
        },
        {
            title: "Nominal",
            align: "right",
            dataIndex: "amount",
            render: (value) => (
                <strong className="text-danger">{formatRupiah(value)}</strong>
            ),
        },
        {
            title: "Catatan",
            dataIndex: "note",
            render: (value) => value || "-",
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
            <Head title="Pengeluaran" />

            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    title={
                        <Title level={5} className="mb-0">
                            PENGELUARAN
                        </Title>
                    }
                    extra={
                        hasAnyPermission(["expenses.create"], permissions) && (
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
                    <form onSubmit={handleFilter} className="mb-4">
                        <Row gutter={[12, 12]}>
                            <Col xs={24} lg={6}>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari kode, judul, atau catatan..."
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Select
                                    allowClear
                                    placeholder="Semua Kategori"
                                    className="w-100"
                                    value={category}
                                    onChange={setCategory}
                                    options={categories.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                    }))}
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <DatePicker
                                    className="w-100"
                                    placeholder="Dari tanggal"
                                    format="YYYY-MM-DD"
                                    value={startDate ? dayjs(startDate) : null}
                                    onChange={(_, dateString) =>
                                        setStartDate(dateString)
                                    }
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <DatePicker
                                    className="w-100"
                                    placeholder="Sampai tanggal"
                                    format="YYYY-MM-DD"
                                    value={endDate ? dayjs(endDate) : null}
                                    onChange={(_, dateString) =>
                                        setEndDate(dateString)
                                    }
                                />
                            </Col>
                            {isAdmin && (
                                <Col xs={24} sm={12} lg={4}>
                                    <Select
                                        allowClear
                                        placeholder="Semua User"
                                        className="w-100"
                                        value={userId}
                                        onChange={setUserId}
                                        options={users.map((user) => ({
                                            value: String(user.id),
                                            label: user.name,
                                        }))}
                                    />
                                </Col>
                            )}
                            <Col xs={24} lg={isAdmin ? 2 : 6}>
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

                    <Row gutter={16} className="mb-4">
                        <Col xs={24} md={12}>
                            <Card size="small">
                                <Statistic
                                    title="Total Pengeluaran"
                                    value={summary.total_amount || 0}
                                    formatter={(value) =>
                                        formatRupiah(value)
                                    }
                                    valueStyle={{ color: "#cf1322" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card size="small">
                                <Statistic
                                    title="Jumlah Data"
                                    value={summary.total_expenses || 0}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        bordered
                        rowKey="id"
                        columns={columns}
                        dataSource={expenses.data}
                        pagination={false}
                        locale={{
                            emptyText:
                                "Data pengeluaran belum tersedia. Catat pengeluaran pertama untuk mulai melacak biaya.",
                        }}
                        scroll={{ x: 1000 }}
                    />

                    <Pagination
                        links={expenses.links}
                        align="end"
                        meta={{
                            current_page: expenses.current_page,
                            per_page: expenses.per_page,
                            total: expenses.total,
                        }}
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
