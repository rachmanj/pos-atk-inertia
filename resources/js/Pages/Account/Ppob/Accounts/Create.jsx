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

const { Title } = Typography;
const { TextArea } = Input;

export default function PpobAccountCreate() {
    const { defaultMinBalance = 100000 } = usePage().props;
    const [name, setName] = useState("");
    const [currentBalance, setCurrentBalance] = useState(0);
    const [minBalanceAlert, setMinBalanceAlert] = useState(
        Number(defaultMinBalance),
    );
    const [isActive, setIsActive] = useState(true);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setSaving(true);

        router.post(
            "/account/ppob-accounts",
            {
                name,
                current_balance: currentBalance,
                min_balance_alert: minBalanceAlert,
                is_active: isActive,
                note,
            },
            { onFinish: () => setSaving(false) },
        );
    };

    return (
        <>
            <Head title="Tambah Akun PPOB - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    style={{ maxWidth: 640 }}
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            TAMBAH AKUN PPOB
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
                    <form onSubmit={submit}>
                        <Form.Item label="Nama Provider" required>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Digiflazz, iReap, dll"
                            />
                        </Form.Item>

                        <Form.Item label="Saldo Awal">
                            <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                value={currentBalance}
                                onChange={(value) =>
                                    setCurrentBalance(value ?? 0)
                                }
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
                            SIMPAN
                        </Button>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
