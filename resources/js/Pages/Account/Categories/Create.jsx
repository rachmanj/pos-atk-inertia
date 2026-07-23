import { useRef, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import {
    Button,
    Card,
    Form,
    Input,
    Space,
    Typography,
    Upload,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    FolderAddOutlined,
    ReloadOutlined,
    SaveOutlined,
    UploadOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function CategoryCreate() {
    const { errors = {} } = usePage().props;

    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const imageInputRef = useRef(null);

    const resetForm = () => {
        setName("");
        setImage(null);

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const storeCategory = (e) => {
        e.preventDefault();
        setSaving(true);

        router.post(
            "/account/categories",
            {
                name,
                image,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    notification.success({
                        message: "Berhasil",
                        description: "Kategori berhasil ditambahkan.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Tambah Kategori - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <FolderAddOutlined style={{ marginRight: 8 }} />
                            TAMBAH KATEGORI
                        </Title>
                    }
                    extra={
                        <Link href="/account/categories">
                            <Button icon={<ArrowLeftOutlined />}>
                                KEMBALI
                            </Button>
                        </Link>
                    }
                >
                    <form onSubmit={storeCategory}>
                        <Form.Item
                            label="Nama Kategori"
                            validateStatus={errors.name ? "error" : ""}
                            help={errors.name}
                            required
                        >
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masukkan nama kategori"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Gambar Kategori"
                            validateStatus={errors.image ? "error" : ""}
                            help={
                                errors.image ||
                                "Boleh dikosongkan. Format: JPG, JPEG, atau PNG maksimal 2MB."
                            }
                        >
                            <Upload
                                accept="image/jpeg,image/png,image/jpg"
                                showUploadList={!!image}
                                beforeUpload={(file) => {
                                    setImage(file);
                                    return false;
                                }}
                                onRemove={() => setImage(null)}
                                maxCount={1}
                            >
                                <Button icon={<UploadOutlined />}>
                                    Pilih Gambar
                                </Button>
                            </Upload>
                        </Form.Item>

                        <Space>
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
                                ATUR ULANG
                            </Button>
                        </Space>
                    </form>
                </Card>
            </LayoutAccount>
        </>
    );
}
