import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    Typography,
} from "antd";
import { ArrowLeftOutlined, PlayCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function CashierShiftCreate() {
    const { errors = {}, flash = {}, ppobAccount = null } = usePage().props;

    const [cashInHand, setCashInHand] = useState(null);
    const [note, setNote] = useState("");

    const openShift = (e) => {
        e.preventDefault();

        router.post("/account/cashier-shifts", {
            cash_in_hand: cashInHand ?? "",
            note,
        });
    };

    return (
        <>
            <Head>
                <title>Buka Shift Kasir - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Card
                    className="border-0 shadow-sm rounded-3 mt-4"
                    style={{ maxWidth: 720 }}
                    title={
                        <Title level={5} className="mb-0">
                            BUKA SHIFT
                        </Title>
                    }
                    extra={
                        <Link href="/account/cashier-shifts">
                            <Button icon={<ArrowLeftOutlined />}>
                                KEMBALI
                            </Button>
                        </Link>
                    }
                >
                    {flash.error && (
                        <Alert
                            type="error"
                            message={flash.error}
                            showIcon
                            className="mb-4"
                        />
                    )}

                    <form onSubmit={openShift}>
                        <Form.Item
                            label="Kas Awal"
                            validateStatus={
                                errors.cash_in_hand ? "error" : ""
                            }
                            help={errors.cash_in_hand}
                            required
                        >
                            <InputNumber
                                min={0}
                                className="w-100"
                                placeholder="0"
                                value={cashInHand}
                                onChange={setCashInHand}
                            />
                            <Paragraph type="secondary" className="mt-1 mb-0">
                                Masukkan saldo awal kas di laci sebelum shift
                                dimulai.
                            </Paragraph>
                        </Form.Item>

                        {ppobAccount && (
                            <Form.Item
                                label={`Saldo PPOB (${ppobAccount.name})`}
                            >
                                <Alert
                                    type="info"
                                    showIcon
                                    message={
                                        <>
                                            Saldo sistem saat ini:{" "}
                                            <strong>
                                                Rp{" "}
                                                {Number(
                                                    ppobAccount.current_balance ||
                                                        0,
                                                ).toLocaleString("id-ID")}
                                            </strong>
                                            . Akun ini dipakai bersama, bisa
                                            dipakai kasir lain secara bersamaan,
                                            jadi saldo tidak perlu dihitung
                                            ulang tiap buka/tutup shift.
                                            Verifikasi saldo fisik di app
                                            provider dilakukan di menu{" "}
                                            <Link href="/account/ppob-balance-logs">
                                                Riwayat Saldo PPOB
                                            </Link>
                                            .
                                        </>
                                    }
                                />
                            </Form.Item>
                        )}

                        <Form.Item
                            label="Catatan Pembukaan"
                            validateStatus={errors.note ? "error" : ""}
                            help={errors.note}
                        >
                            <Input.TextArea
                                rows={4}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Contoh: laci kas sudah dicek, saldo awal sesuai."
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<PlayCircleOutlined />}
                        >
                            MULAI SHIFT
                        </Button>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
