import LayoutAccount from "../../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import { Button, Card, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, WalletOutlined } from "@ant-design/icons";
import hasAnyPermission from "../../../../Utils/Permissions";
import { formatRupiah } from "../../../../Utils/format";

const { Title } = Typography;

export default function PpobAccountIndex() {
    const { accounts = [], auth = {} } = usePage().props;
    const permissions = auth.permissions || {};

    const columns = [
        {
            title: "Nama",
            dataIndex: "name",
        },
        {
            title: "Saldo",
            dataIndex: "current_balance",
            render: (value, record) => (
                <span
                    className={
                        record.current_balance <= record.min_balance_alert
                            ? "text-danger fw-bold"
                            : ""
                    }
                >
                    {formatRupiah(value)}
                </span>
            ),
        },
        {
            title: "Alert Minimum",
            dataIndex: "min_balance_alert",
            render: (value) => formatRupiah(value),
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
            width: 100,
            render: (_, account) =>
                hasAnyPermission(["ppob-accounts.edit"], permissions) ? (
                    <Link href={`/account/ppob-accounts/${account.id}/edit`}>
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                        >
                            Edit
                        </Button>
                    </Link>
                ) : null,
        },
    ];

    return (
        <>
            <Head title="Akun PPOB - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <WalletOutlined style={{ marginRight: 8 }} />
                            AKUN PPOB
                        </Title>
                    }
                    extra={
                        hasAnyPermission(
                            ["ppob-accounts.create"],
                            permissions,
                        ) && (
                            <Link href="/account/ppob-accounts/create">
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                >
                                    TAMBAH AKUN
                                </Button>
                            </Link>
                        )
                    }
                >
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={accounts}
                        pagination={false}
                        locale={{ emptyText: "Belum ada akun PPOB." }}
                    />
                </Card>
            </LayoutAccount>
        </>
    );
}
