import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function UnitCreate() {
    const { errors = {} } = usePage().props;
    const [name, setName] = useState("");
    const [abbreviation, setAbbreviation] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setSaving(true);

        router.post(
            "/account/units",
            { name, abbreviation },
            { onFinish: () => setSaving(false) },
        );
    };

    return (
        <>
            <Head title="Tambah Satuan - ZenPOS" />

            <LayoutAccount>
                <Card
                    style={{ maxWidth: 640 }}
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            TAMBAH SATUAN
                        </Title>
                    }
                    extra={
                        <Link href="/account/units">
                            <Button icon={<ArrowLeftOutlined />}>
                                KEMBALI
                            </Button>
                        </Link>
                    }
                >
                    <form onSubmit={submit}>
                        <Form.Item
                            label="Nama Satuan"
                            validateStatus={errors.name ? "error" : ""}
                            help={errors.name}
                            required
                        >
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Pieces, Box, Lusin"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Singkatan"
                            validateStatus={errors.abbreviation ? "error" : ""}
                            help={errors.abbreviation}
                            required
                        >
                            <Input
                                value={abbreviation}
                                onChange={(e) =>
                                    setAbbreviation(e.target.value)
                                }
                                placeholder="pcs, box, lsn"
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
