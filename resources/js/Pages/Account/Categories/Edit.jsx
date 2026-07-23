import { useRef, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import {
    Button,
    Card,
    Form,
    Image,
    Input,
    Space,
    Typography,
    Upload,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    FolderOpenOutlined,
    ReloadOutlined,
    SaveOutlined,
    UploadOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function CategoryEdit() {
    const { errors = {}, category } = usePage().props;

    const [name, setName] = useState(category.name);
    const [image, setImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const imageInputRef = useRef(null);

    const resetForm = () => {
        setName(category.name);
        setImage(null);

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const updateCategory = (e) => {
        e.preventDefault();
        setSaving(true);

        router.post(
            `/account/categories/${category.id}`,
            {
                _method: "PUT",
                name,
                image,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    notification.success({
                        message: "Berhasil",
                        description: "Kategori berhasil diperbarui.",
                        duration: 2,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Edit Kategori - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <FolderOpenOutlined style={{ marginRight: 8 }} />
                            EDIT KATEGORI
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
                    <form onSubmit={updateCategory}>
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
                                "Boleh dikosongkan jika tidak ingin mengubah gambar. Format: JPG, JPEG, atau PNG maksimal 2MB."
                            }
                        >
                            {category.image && !image && (
                                <div style={{ marginBottom: 12 }}>
                                    <Image
                                        src={category.image}
                                        alt={category.name}
                                        width={100}
                                        height={100}
                                        className="rounded-3 object-fit-cover"
                                        preview={false}
                                    />
                                </div>
                            )}

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
                                    Pilih Gambar Baru
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
                                PERBARUI
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
