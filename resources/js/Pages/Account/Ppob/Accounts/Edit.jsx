import { useState } from "react";
import LayoutAccount from "../../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    Switch,
    Typography,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { formatRupiah } from "../../../../Utils/format";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function PpobAccountEdit() {
    const { account } = usePage().props;
    const [name, setName] = useState(account.name || "");
    const [minBalanceAlert, setMinBalanceAlert] = useState(
        Number(account.min_balance_alert || 0),
    );
    const [isActive, setIsActive] = useState(!!account.is_active);
    const [note, setNote] = useState(account.note || "");
    const [saving, setSaving] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setSaving(true);

        router.put(
            `/account/ppob-accounts/${account.id}`,
            {
                name,
                min_balance_alert: minBalanceAlert,
                is_active: isActive,
                note,
            },
            { onFinish: () => setSaving(false) },
        );
    };

    return (
        <>
            <Head title="Edit Akun PPOB - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    style={{ maxWidth: 640 }}
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            EDIT AKUN PPOB
                        </Title>
                    }
                    extra={
                        <Link href="/account/ppob-accounts">
                            <Button icon={<ArrowLeftOutlined />}>
                                KEMBALI
                            </Button>
                        </Link>
                    }
                >
                    <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                        Saldo saat ini:{" "}
                        <Text strong>{formatRupiah(account.current_balance)}</Text>
                    </Text>

                    <form onSubmit={submit}>
                        <Form.Item label="Nama Provider" required>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item label="Alert Saldo Minimum">
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                value={minBalanceAlert}
                                onChange={(value) =>
                                    setMinBalanceAlert(value ?? 0)
                                }
                            />
                        </Form.Item>

                        <Form.Item label="Aktif">
                            <Switch
                                checked={isActive}
                                onChange={setIsActive}
                            />
                        </Form.Item>

                        <Form.Item label="Catatan">
                            <TextArea
                                rows={3}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={saving}
                        >
                            UPDATE
                        </Button>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
