import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Button, Card, Form, Input, Typography } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function UnitEdit() {
    const { unit, errors = {} } = usePage().props;
    const [name, setName] = useState(unit.name || "");
    const [abbreviation, setAbbreviation] = useState(unit.abbreviation || "");
    const [saving, setSaving] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setSaving(true);

        router.put(
            `/account/units/${unit.id}`,
            { name, abbreviation },
            { onFinish: () => setSaving(false) },
        );
    };

    return (
        <>
            <Head title="Edit Satuan - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    style={{ maxWidth: 640 }}
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            EDIT SATUAN
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
