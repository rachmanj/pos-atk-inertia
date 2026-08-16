import { useState } from "react";
import LayoutAccount from "../../../../Layouts/Account";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import { FilterOutlined, UnorderedListOutlined } from "@ant-design/icons";
import Pagination from "../../../../Shared/Pagination";
import hasAnyPermission from "../../../../Utils/Permissions";
import { formatRupiah } from "../../../../Utils/format";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const typeLabels = {
    opening_balance: "Saldo Awal",
    top_up: "Top Up",
    sale: "Penjualan",
    adjustment: "Penyesuaian",
};

export default function PpobBalanceLogIndex() {
    const { logs, accounts = [], filters = {}, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};
    const isAdmin = hasAnyPermission(["ppob-accounts.edit"], permissions);

    const [ppobAccountId, setPpobAccountId] = useState(
        filters.ppob_account_id || "",
    );
    const [type, setType] = useState(filters.type || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [topUpAccountId, setTopUpAccountId] = useState(
        accounts[0]?.id ? String(accounts[0].id) : "",
    );
    const [topUpAmount, setTopUpAmount] = useState("");
    const [topUpNote, setTopUpNote] = useState("");
    const [adjustDirection, setAdjustDirection] = useState("increase");
    const [filtering, setFiltering] = useState(false);

    const applyFilter = () => {
        setFiltering(true);
        router.get(
            "/account/ppob-balance-logs",
            {
                ppob_account_id: ppobAccountId,
                type,
                start_date: startDate,
                end_date: endDate,
            },
            { onFinish: () => setFiltering(false) },
        );
    };

    const submitTopUp = (e) => {
        e.preventDefault();
        router.post(
            "/account/ppob-balance-logs",
            {
                ppob_account_id: topUpAccountId,
                type: "top_up",
                amount: topUpAmount,
                note: topUpNote,
            },
            {
                onSuccess: () => {
                    setTopUpAmount("");
                    setTopUpNote("");
                },
            },
        );
    };

    const submitAdjustment = (e) => {
        e.preventDefault();
        router.post(
            "/account/ppob-balance-logs",
            {
                ppob_account_id: topUpAccountId,
                type: "adjustment",
                amount: topUpAmount,
                direction: adjustDirection,
                note: topUpNote,
            },
            {
                onSuccess: () => {
                    setTopUpAmount("");
                    setTopUpNote("");
                },
            },
        );
    };

    const columns = [
        {
            title: "Tanggal",
            dataIndex: "created_at",
            render: (value) =>
                new Date(value).toLocaleString("id-ID"),
        },
        {
            title: "Akun",
            render: (_, log) => log.ppob_account?.name,
        },
        {
            title: "Tipe",
            dataIndex: "type",
            render: (value) => (
                <Tag>{typeLabels[value] || value}</Tag>
            ),
        },
        {
            title: "Jumlah",
            dataIndex: "amount",
            render: (value) => (
                <span className={value < 0 ? "text-danger" : "text-success"}>
                    {formatRupiah(value)}
                </span>
            ),
        },
        {
            title: "Saldo Sebelum",
            dataIndex: "balance_before",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Saldo Sesudah",
            dataIndex: "balance_after",
            render: (value) => formatRupiah(value),
        },
        {
            title: "Kasir",
            render: (_, log) => log.user?.name,
        },
        {
            title: "Catatan",
            dataIndex: "note",
            render: (value) => value || "-",
        },
    ];

    return (
        <>
            <Head title="Riwayat Saldo PPOB - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <UnorderedListOutlined style={{ marginRight: 8 }} />
                            RIWAYAT SALDO PPOB
                        </Title>
                    }
                >
                    {accounts.length > 0 && (
                        <>
                            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                {accounts.map((account) => (
                                    <Col xs={24} md={8} key={account.id}>
                                        <Card
                                            size="small"
                                            className={
                                                account.is_active
                                                    ? "bg-light"
                                                    : ""
                                            }
                                        >
                                            <Text
                                                type="secondary"
                                                style={{
                                                    display: "block",
                                                    fontSize: 12,
                                                }}
                                            >
                                                Saldo Sistem Saat Ini{" "}
                                                {account.is_active && (
                                                    <Tag color="success">
                                                        Aktif
                                                    </Tag>
                                                )}
                                            </Text>
                                            <Text strong>{account.name}</Text>
                                            <div>
                                                <Text
                                                    strong
                                                    style={{ color: "#3b82f6" }}
                                                >
                                                    {formatRupiah(
                                                        account.current_balance,
                                                    )}
                                                </Text>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <Text
                                type="secondary"
                                style={{
                                    display: "block",
                                    marginBottom: 16,
                                    fontSize: 12,
                                }}
                            >
                                Akun ini bisa dipakai bersamaan oleh beberapa
                                kasir shift yang berbeda. Cocokkan saldo di atas
                                dengan saldo di app provider, lalu catat
                                selisihnya lewat Penyesuaian di bawah, bukan
                                lewat form buka/tutup shift.
                            </Text>
                        </>
                    )}

                    <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                        <Col xs={24} md={6}>
                            <Select
                                style={{ width: "100%" }}
                                value={ppobAccountId || undefined}
                                onChange={(value) =>
                                    setPpobAccountId(value || "")
                                }
                                placeholder="Semua Akun"
                                allowClear
                                options={[
                                    ...accounts.map((account) => ({
                                        value: String(account.id),
                                        label: account.name,
                                    })),
                                ]}
                            />
                        </Col>
                        <Col xs={24} md={4}>
                            <Select
                                style={{ width: "100%" }}
                                value={type || undefined}
                                onChange={(value) => setType(value || "")}
                                placeholder="Semua Tipe"
                                allowClear
                                options={Object.entries(typeLabels).map(
                                    ([key, label]) => ({
                                        value: key,
                                        label,
                                    }),
                                )}
                            />
                        </Col>
                        <Col xs={24} md={4}>
                            <DatePicker
                                style={{ width: "100%" }}
                                value={
                                    startDate ? dayjs(startDate) : null
                                }
                                onChange={(date) =>
                                    setStartDate(
                                        date
                                            ? date.format("YYYY-MM-DD")
                                            : "",
                                    )
                                }
                                placeholder="Tanggal mulai"
                                format="DD/MM/YYYY"
                            />
                        </Col>
                        <Col xs={24} md={4}>
                            <DatePicker
                                style={{ width: "100%" }}
                                value={endDate ? dayjs(endDate) : null}
                                onChange={(date) =>
                                    setEndDate(
                                        date
                                            ? date.format("YYYY-MM-DD")
                                            : "",
                                    )
                                }
                                placeholder="Tanggal akhir"
                                format="DD/MM/YYYY"
                            />
                        </Col>
                        <Col xs={24} md={4}>
                            <Button
                                type="primary"
                                icon={<FilterOutlined />}
                                onClick={applyFilter}
                                loading={filtering}
                                block
                            >
                                Filter
                            </Button>
                        </Col>
                    </Row>

                    {hasAnyPermission(
                        ["ppob-balance-logs.store"],
                        permissions,
                    ) && (
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                            <Col xs={24} lg={12}>
                                <Card size="small" title="Top Up Saldo">
                                    <form onSubmit={submitTopUp}>
                                        <Space
                                            direction="vertical"
                                            style={{ width: "100%" }}
                                            size="small"
                                        >
                                            <Select
                                                value={topUpAccountId}
                                                onChange={setTopUpAccountId}
                                                style={{ width: "100%" }}
                                                options={accounts.map(
                                                    (account) => ({
                                                        value: String(
                                                            account.id,
                                                        ),
                                                        label: account.name,
                                                    }),
                                                )}
                                            />
                                            <Row gutter={8}>
                                                <Col span={12}>
                                                    <InputNumber
                                                        min={1}
                                                        style={{
                                                            width: "100%",
                                                        }}
                                                        placeholder="Jumlah"
                                                        value={
                                                            topUpAmount || null
                                                        }
                                                        onChange={(value) =>
                                                            setTopUpAmount(
                                                                value ?? "",
                                                            )
                                                        }
                                                        required
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Input
                                                        placeholder="Catatan"
                                                        value={topUpNote}
                                                        onChange={(e) =>
                                                            setTopUpNote(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Col>
                                            </Row>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                size="small"
                                            >
                                                Catat Top Up
                                            </Button>
                                        </Space>
                                    </form>
                                </Card>
                            </Col>

                            {isAdmin && (
                                <Col xs={24} lg={12}>
                                    <Card
                                        size="small"
                                        title="Penyesuaian (Admin)"
                                    >
                                        <form onSubmit={submitAdjustment}>
                                            <Space
                                                direction="vertical"
                                                style={{ width: "100%" }}
                                                size="small"
                                            >
                                                <Select
                                                    value={topUpAccountId}
                                                    onChange={
                                                        setTopUpAccountId
                                                    }
                                                    style={{ width: "100%" }}
                                                    options={accounts.map(
                                                        (account) => ({
                                                            value: String(
                                                                account.id,
                                                            ),
                                                            label: account.name,
                                                        }),
                                                    )}
                                                />
                                                <Row gutter={8}>
                                                    <Col span={8}>
                                                        <Select
                                                            value={
                                                                adjustDirection
                                                            }
                                                            onChange={
                                                                setAdjustDirection
                                                            }
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            options={[
                                                                {
                                                                    value: "increase",
                                                                    label: "Tambah",
                                                                },
                                                                {
                                                                    value: "decrease",
                                                                    label: "Kurang",
                                                                },
                                                            ]}
                                                        />
                                                    </Col>
                                                    <Col span={16}>
                                                        <InputNumber
                                                            min={1}
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            placeholder="Jumlah"
                                                            value={
                                                                topUpAmount ||
                                                                null
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) =>
                                                                setTopUpAmount(
                                                                    value ??
                                                                        "",
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </Col>
                                                </Row>
                                                <Input
                                                    placeholder="Catatan"
                                                    value={topUpNote}
                                                    onChange={(e) =>
                                                        setTopUpNote(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <Button
                                                    htmlType="submit"
                                                    size="small"
                                                >
                                                    Catat Penyesuaian
                                                </Button>
                                            </Space>
                                        </form>
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    )}

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={logs.data}
                        pagination={false}
                        scroll={{ x: true }}
                        locale={{ emptyText: "Belum ada riwayat saldo." }}
                    />

                    <Pagination links={logs.links} meta={logs} />
                </Card>
            </LayoutAccount>
        </>
    );
}
