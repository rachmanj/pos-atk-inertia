import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, SEMANTIC } from "../../../theme/colors";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Typography,
} from "antd";
import {
    EyeOutlined,
    FilterOutlined,
    ReloadOutlined,
    ShoppingOutlined,
    UndoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const reasonLabels = {
    defect: "Barang Rusak",
    expired: "Kedaluwarsa",
    wrong_item: "Barang Tidak Sesuai",
    other: "Lainnya",
};

export default function SupplierReturnIndex() {
    const { supplierReturns, suppliers, filters, flash } = usePage().props;
    const loading = useInertiaLoading();

    const [search, setSearch] = useState(filters.q || "");
    const [supplierId, setSupplierId] = useState(
        filters.supplier_id || undefined,
    );
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleFilter = (e) => {
        e.preventDefault();

        router.get("/account/supplier-returns", {
            q: search,
            supplier_id: supplierId || "",
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleReset = () => {
        setSearch("");
        setSupplierId(undefined);
        setStartDate("");
        setEndDate("");

        router.get("/account/supplier-returns");
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index +
                1 +
                (supplierReturns.current_page - 1) *
                    supplierReturns.per_page,
        },
        {
            title: "Invoice Retur",
            dataIndex: "invoice",
            render: (value) => (
                <Text strong style={{ color: BRAND.primary }}>
                    {value}
                </Text>
            ),
        },
        {
            title: "Invoice Pembelian",
            render: (_, record) => record.purchase?.invoice || "-",
        },
        {
            title: "Tanggal",
            dataIndex: "return_date",
            render: (value) =>
                new Date(value).toLocaleDateString("id-ID"),
        },
        {
            title: "Supplier",
            render: (_, record) => record.supplier?.name || "-",
        },
        {
            title: "Alasan",
            dataIndex: "reason",
            render: (value) => reasonLabels[value] || value,
        },
        {
            title: "Qty",
            align: "center",
            dataIndex: "total_qty",
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: "Total",
            align: "right",
            dataIndex: "total_amount",
            render: (value) => (
                <Text strong style={{ color: SEMANTIC.error }}>
                    {formatRupiah(value)}
                </Text>
            ),
        },
        {
            title: "Aksi",
            width: 100,
            align: "center",
            render: (_, record) =>
                hasAnyPermission(["supplier_returns.show"]) ? (
                    <Link
                        href={`/account/supplier-returns/${record.invoice}`}
                    >
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
                <title>Retur Supplier - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <UndoOutlined
                                    style={{ color: BRAND.primary }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    RETUR SUPPLIER
                                </Title>
                            </Space>
                        }
                        extra={
                            hasAnyPermission(["purchases.index"]) && (
                                <Link href="/account/purchases">
                                    <Button icon={<ShoppingOutlined />}>
                                        LIHAT PEMBELIAN
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
                                <Col xs={24} lg={8}>
                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari invoice retur, invoice pembelian, supplier, atau pembuat..."
                                    />
                                </Col>
                                <Col xs={24} sm={8} lg={4}>
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
                                <Col xs={24} sm={8} lg={4}>
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
                                <Col xs={24} sm={8} lg={4}>
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
                                <Col xs={24} lg={4}>
                                    <Space>
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

                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={supplierReturns.data}
                            pagination={false}
                            scroll={{ x: "max-content" }}
                            locale={{
                                emptyText:
                                    "Belum ada retur supplier. Buat retur dari detail pembelian yang sudah tercatat.",
                            }}
                        />

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <Pagination
                                links={supplierReturns.links}
                                align="end"
                                meta={{
                                    current_page:
                                        supplierReturns.current_page,
                                    per_page: supplierReturns.per_page,
                                    total: supplierReturns.total,
                                }}
                            />
                        </div>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
