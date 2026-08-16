import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router } from "@inertiajs/react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND } from "../../../theme/colors";
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Spin,
    Typography,
    notification,
} from "antd";
import { KeyOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function ChangePassword() {
    const { errors = {} } = usePage().props;
    const loading = useInertiaLoading();

    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const updatePassword = (e) => {
        e.preventDefault();

        router.put(
            "/account/password",
            {
                current_password: currentPassword,
                password: password,
                password_confirmation: passwordConfirmation,
            },
            {
                onSuccess: () => {
                    setCurrentPassword("");
                    setPassword("");
                    setPasswordConfirmation("");

                    notification.success({
                        message: "Berhasil",
                        description: "Kata sandi berhasil diperbarui.",
                        duration: 1.5,
                    });
                },
            },
        );
    };

    return (
        <>
            <Head>
                <title>Ubah Kata Sandi - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Row>
                        <Col xs={24} lg={12}>
                            <Card
                                title={
                                    <Title level={4} style={{ margin: 0 }}>
                                        <KeyOutlined
                                            style={{
                                                marginRight: 8,
                                                color: BRAND.primary,
                                            }}
                                        />
                                        UBAH KATA SANDI
                                    </Title>
                                }
                            >
                                <form onSubmit={updatePassword}>
                                    <Form.Item
                                        label="Kata Sandi Saat Ini"
                                        validateStatus={
                                            errors.current_password
                                                ? "error"
                                                : ""
                                        }
                                        help={errors.current_password}
                                        required
                                    >
                                        <Input.Password
                                            value={currentPassword}
                                            onChange={(e) =>
                                                setCurrentPassword(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Masukkan kata sandi saat ini"
                                            autoComplete="current-password"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Kata Sandi Baru"
                                        validateStatus={
                                            errors.password ? "error" : ""
                                        }
                                        help={errors.password}
                                        required
                                    >
                                        <Input.Password
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            placeholder="Masukkan kata sandi baru"
                                            autoComplete="new-password"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Konfirmasi Kata Sandi Baru"
                                        required
                                    >
                                        <Input.Password
                                            value={passwordConfirmation}
                                            onChange={(e) =>
                                                setPasswordConfirmation(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ulangi kata sandi baru"
                                            autoComplete="new-password"
                                        />
                                    </Form.Item>

                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                    >
                                        SIMPAN KATA SANDI
                                    </Button>
                                </form>
                            </Card>
                        </Col>
                    </Row>
                </Spin>
            </LayoutAccount>
        </>
    );
}
