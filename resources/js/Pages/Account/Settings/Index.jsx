import { useRef, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Button,
    Card,
    Checkbox,
    Col,
    Form,
    Input,
    InputNumber,
    Radio,
    Row,
    Space,
    Typography,
    Upload,
    notification,
} from "antd";
import {
    ReloadOutlined,
    SaveOutlined,
    ShopOutlined,
    UploadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SettingIndex() {
    const { errors = {}, store = {}, ppob = {} } = usePage().props;

    const logoInputRef = useRef(null);

    const [name, setName] = useState(store.name || "");
    const [address, setAddress] = useState(store.address || "");
    const [phone, setPhone] = useState(store.phone || "");
    const [email, setEmail] = useState(store.email || "");
    const [receiptPaperSize, setReceiptPaperSize] = useState(
        store.receipt_paper_size || "58",
    );
    const [ppobAdminFee, setPpobAdminFee] = useState(
        Number(ppob.ppob_admin_fee || 2000),
    );
    const [ppobMinBalanceDefault, setPpobMinBalanceDefault] = useState(
        Number(ppob.ppob_min_balance_default || 100000),
    );
    const [logo, setLogo] = useState(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [saving, setSaving] = useState(false);

    const updateSettings = (e) => {
        e.preventDefault();
        setSaving(true);

        router.post(
            "/account/settings",
            {
                _method: "PUT",
                name,
                address,
                phone,
                email,
                receipt_paper_size: receiptPaperSize,
                ppob_admin_fee: ppobAdminFee,
                ppob_min_balance_default: ppobMinBalanceDefault,
                logo,
                remove_logo: removeLogo,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    setLogo(null);
                    setRemoveLogo(false);

                    if (logoInputRef.current) {
                        logoInputRef.current.value = "";
                    }

                    notification.success({
                        message: "Berhasil",
                        description: "Pengaturan toko berhasil diperbarui.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    const resetForm = () => {
        setName(store.name || "");
        setAddress(store.address || "");
        setPhone(store.phone || "");
        setEmail(store.email || "");
        setReceiptPaperSize(store.receipt_paper_size || "58");
        setPpobAdminFee(Number(ppob.ppob_admin_fee || 2000));
        setPpobMinBalanceDefault(
            Number(ppob.ppob_min_balance_default || 100000),
        );
        setLogo(null);
        setRemoveLogo(false);

        if (logoInputRef.current) {
            logoInputRef.current.value = "";
        }
    };

    const logoPreview =
        logo && !removeLogo
            ? URL.createObjectURL(logo)
            : store.logo_url && !removeLogo
              ? store.logo_url
              : null;

    return (
        <>
            <Head title="Pengaturan Toko" />

            <LayoutAccount>
                <Card>
                    <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
                        <Title level={4} style={{ margin: 0 }}>
                            <ShopOutlined style={{ marginRight: 8 }} />
                            PENGATURAN TOKO
                        </Title>
                        <Text type="secondary">
                            Pengaturan identitas toko untuk sidebar, login, dan
                            struk transaksi.
                        </Text>
                    </Space>

                    <form onSubmit={updateSettings}>
                        <Row gutter={24}>
                            <Col xs={24} lg={16}>
                                <Form.Item
                                    label="Nama Toko"
                                    validateStatus={errors.name ? "error" : ""}
                                    help={errors.name}
                                    required
                                >
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Masukkan nama toko"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Alamat"
                                    validateStatus={errors.address ? "error" : ""}
                                    help={errors.address}
                                >
                                    <TextArea
                                        rows={3}
                                        value={address}
                                        onChange={(e) =>
                                            setAddress(e.target.value)
                                        }
                                        placeholder="Alamat toko"
                                    />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Telepon"
                                            validateStatus={
                                                errors.phone ? "error" : ""
                                            }
                                            help={errors.phone}
                                        >
                                            <Input
                                                value={phone}
                                                onChange={(e) =>
                                                    setPhone(e.target.value)
                                                }
                                                placeholder="Nomor telepon toko"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Email"
                                            validateStatus={
                                                errors.email ? "error" : ""
                                            }
                                            help={errors.email}
                                        >
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                placeholder="Email toko"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    label="Ukuran Struk"
                                    validateStatus={
                                        errors.receipt_paper_size ? "error" : ""
                                    }
                                    help={
                                        errors.receipt_paper_size ||
                                        "Pilih 58mm untuk printer thermal kecil atau 80mm untuk printer kasir lebar."
                                    }
                                >
                                    <Radio.Group
                                        value={receiptPaperSize}
                                        onChange={(e) =>
                                            setReceiptPaperSize(e.target.value)
                                        }
                                        optionType="button"
                                        buttonStyle="solid"
                                        style={{ width: "100%" }}
                                    >
                                        <Radio.Button
                                            value="58"
                                            style={{ width: "50%", textAlign: "center" }}
                                        >
                                            58mm
                                        </Radio.Button>
                                        <Radio.Button
                                            value="80"
                                            style={{ width: "50%", textAlign: "center" }}
                                        >
                                            80mm
                                        </Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>

                            <Col xs={24} lg={8}>
                                <Card size="small" title="Logo Toko">
                                    <div style={{ marginBottom: 16 }}>
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt={name}
                                                className="rounded-3 shadow-sm border object-fit-cover"
                                                style={{
                                                    width: 120,
                                                    height: 120,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-muted border"
                                                style={{
                                                    width: 120,
                                                    height: 120,
                                                }}
                                            >
                                                <ShopOutlined
                                                    style={{ fontSize: 32 }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Upload
                                        accept="image/jpeg,image/png,image/jpg"
                                        showUploadList={false}
                                        beforeUpload={(file) => {
                                            setLogo(file);
                                            setRemoveLogo(false);
                                            return false;
                                        }}
                                    >
                                        <Button icon={<UploadOutlined />}>
                                            Pilih Logo
                                        </Button>
                                    </Upload>

                                    {errors.logo && (
                                        <Text
                                            type="danger"
                                            style={{
                                                display: "block",
                                                marginTop: 8,
                                            }}
                                        >
                                            {errors.logo}
                                        </Text>
                                    )}

                                    {!errors.logo && (
                                        <Text
                                            type="secondary"
                                            style={{
                                                display: "block",
                                                marginTop: 8,
                                                fontSize: 12,
                                            }}
                                        >
                                            Format JPG, JPEG, atau PNG maksimal
                                            2MB.
                                        </Text>
                                    )}

                                    {logo && (
                                        <Text
                                            type="secondary"
                                            style={{
                                                display: "block",
                                                marginTop: 8,
                                                fontSize: 12,
                                            }}
                                        >
                                            File baru: {logo.name}
                                        </Text>
                                    )}

                                    {store.logo_url && (
                                        <Checkbox
                                            checked={removeLogo}
                                            onChange={(e) => {
                                                setRemoveLogo(e.target.checked);
                                                setLogo(null);
                                            }}
                                            style={{ marginTop: 12 }}
                                        >
                                            Hapus logo saat ini
                                        </Checkbox>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        <Title level={5} style={{ marginTop: 8 }}>
                            Pengaturan PPOB
                        </Title>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="Admin Fee Default (Rp)">
                                    <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        value={ppobAdminFee}
                                        onChange={(value) =>
                                            setPpobAdminFee(value ?? 0)
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="Alert Saldo Minimum Default (Rp)">
                                    <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        value={ppobMinBalanceDefault}
                                        onChange={(value) =>
                                            setPpobMinBalanceDefault(value ?? 0)
                                        }
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Space style={{ marginTop: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={saving}
                            >
                                SIMPAN
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={resetForm}
                            >
                                RESET
                            </Button>
                        </Space>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
