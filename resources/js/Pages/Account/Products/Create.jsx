import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Typography,
    Upload,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    BarcodeOutlined,
    ReloadOutlined,
    SaveOutlined,
    UploadOutlined,
    AppstoreAddOutlined,
} from "@ant-design/icons";
import ProductUnitBuilder from "../../../Components/ProductUnitBuilder";
import ProductComponentBuilder from "../../../Components/ProductComponentBuilder";
import BarcodeScanner from "../../../Components/BarcodeScanner";
import useMobile from "../../../Hooks/useMobile";

const { Title, Text } = Typography;

export default function ProductCreate() {
    const {
        errors = {},
        categories = [],
        units = [],
        physicalProducts = [],
    } = usePage().props;

    const [barcode, setBarcode] = useState("");
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState(undefined);
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState("");
    const [productType, setProductType] = useState("physical");
    const [openingBuyPrice, setOpeningBuyPrice] = useState(null);
    const [stock, setStock] = useState(null);
    const [productUnits, setProductUnits] = useState([
        {
            unit_id: units[0]?.id ? String(units[0].id) : "",
            conversion_factor: 1,
            sell_price: 0,
            is_base_unit: true,
            is_default_sell: true,
        },
    ]);
    const [serviceSellPrice, setServiceSellPrice] = useState(null);
    const [serviceUnitId, setServiceUnitId] = useState(
        units[0]?.id ? String(units[0].id) : undefined,
    );
    const [components, setComponents] = useState([
        { component_product_id: "", qty_per_unit: 1, note: "" },
    ]);
    const [saving, setSaving] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

    const isMobile = useMobile();

    const isPhysical = productType === "physical";
    const isService = productType === "service";

    const categoryOptions = categories.map((category) => ({
        value: category.id,
        label: category.name,
    }));

    const unitOptions = units.map((unit) => ({
        value: String(unit.id),
        label: `${unit.name} (${unit.abbreviation})`,
    }));

    const productTypeOptions = [
        { value: "physical", label: "Fisik (Stok)" },
        { value: "service", label: "Layanan (BOM)" },
        { value: "ppob", label: "PPOB (Digital)" },
    ];

    const generateBarcode = () => {
        const randomBarcode = Math.floor(
            1000000000000 + Math.random() * 9000000000000,
        ).toString();
        setBarcode(randomBarcode);
    };

    const resetForm = () => {
        setBarcode("");
        setTitle("");
        setCategoryId(undefined);
        setImage(null);
        setDescription("");
        setProductType("physical");
        setOpeningBuyPrice(null);
        setStock(null);
        setProductUnits([
            {
                unit_id: units[0]?.id ? String(units[0].id) : "",
                conversion_factor: 1,
                sell_price: 0,
                is_base_unit: true,
                is_default_sell: true,
            },
        ]);
        setServiceSellPrice(null);
        setServiceUnitId(units[0]?.id ? String(units[0].id) : undefined);
        setComponents([
            { component_product_id: "", qty_per_unit: 1, note: "" },
        ]);
    };

    const storeProduct = (e) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            barcode,
            title,
            category_id: categoryId,
            description,
            product_type: productType,
            buy_price: isPhysical ? openingBuyPrice : 0,
            stock: isPhysical ? stock : 0,
            product_units: JSON.stringify(
                productUnits.map((row) => ({
                    ...row,
                    unit_id: Number(row.unit_id),
                    conversion_factor: Number(row.conversion_factor),
                    sell_price: Number(row.sell_price || 0),
                })),
            ),
        };

        if (isService) {
            payload.sell_price = serviceSellPrice;
            payload.unit_id = serviceUnitId;
            payload.components = JSON.stringify(
                components.map((row) => ({
                    component_product_id: Number(row.component_product_id),
                    qty_per_unit: Number(row.qty_per_unit || 0),
                    note: row.note || null,
                })),
            );
        }

        if (image instanceof File) {
            payload.image = image;
        }

        router.post("/account/products", payload, {
            forceFormData: image instanceof File,
            onSuccess: () => {
                notification.success({
                    message: "Berhasil",
                    description: "Data berhasil disimpan!",
                    duration: 2,
                });
            },
            onFinish: () => setSaving(false),
        });
    };

    return (
        <>
            <Head title="Tambah Produk - ZenPOS" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <AppstoreAddOutlined style={{ marginRight: 8 }} />
                            TAMBAH PRODUK
                        </Title>
                    }
                    extra={
                        <Link href="/account/products">
                            <Button icon={<ArrowLeftOutlined />}>KEMBALI</Button>
                        </Link>
                    }
                >
                    <form onSubmit={storeProduct}>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Barcode"
                                    validateStatus={errors.barcode ? "error" : ""}
                                    help={errors.barcode}
                                    required
                                >
                                    <Space.Compact style={{ width: "100%" }}>
                                        <Input
                                            value={barcode}
                                            onChange={(e) =>
                                                setBarcode(e.target.value)
                                            }
                                            placeholder="Masukkan barcode atau scan"
                                        />
                                        {isMobile && (
                                            <Button
                                                aria-label="Scan barcode"
                                                onClick={() =>
                                                    setShowBarcodeScanner(true)
                                                }
                                            >
                                                📷
                                            </Button>
                                        )}
                                        <Button
                                            type="primary"
                                            icon={<BarcodeOutlined />}
                                            onClick={generateBarcode}
                                        >
                                            Generate
                                        </Button>
                                    </Space.Compact>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Kategori"
                                    validateStatus={
                                        errors.category_id ? "error" : ""
                                    }
                                    help={errors.category_id}
                                    required
                                >
                                    <Select
                                        placeholder="-- Pilih Kategori --"
                                        value={categoryId}
                                        options={categoryOptions}
                                        onChange={setCategoryId}
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Nama Produk"
                                    validateStatus={errors.title ? "error" : ""}
                                    help={errors.title}
                                    required
                                >
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Masukkan nama produk"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label={
                                        <>
                                            Gambar Produk{" "}
                                            <Text type="secondary">(Opsional)</Text>
                                        </>
                                    }
                                    validateStatus={errors.image ? "error" : ""}
                                    help={errors.image}
                                >
                                    <Upload
                                        accept="image/*"
                                        showUploadList={!!image}
                                        maxCount={1}
                                        beforeUpload={(file) => {
                                            setImage(file);
                                            return false;
                                        }}
                                        onRemove={() => setImage(null)}
                                    >
                                        <Button icon={<UploadOutlined />}>
                                            Pilih Gambar
                                        </Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item label="Tipe Produk">
                                    <Select
                                        value={productType}
                                        options={productTypeOptions}
                                        onChange={setProductType}
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {isPhysical ? (
                            <>
                                <ProductUnitBuilder
                                    units={units}
                                    rows={productUnits}
                                    onChange={setProductUnits}
                                    errors={errors}
                                />
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label={
                                                <>
                                                    Harga Beli Awal{" "}
                                                    <Text type="secondary">
                                                        (satuan dasar)
                                                    </Text>
                                                </>
                                            }
                                            validateStatus={
                                                errors.buy_price ? "error" : ""
                                            }
                                            help={
                                                errors.buy_price ||
                                                "Modal per satuan dasar untuk stok awal. Setelah ada pembelian, HPP mengikuti rata-rata tertimbang (WAC)."
                                            }
                                        >
                                            <InputNumber
                                                min={0}
                                                prefix="Rp"
                                                style={{ width: "100%" }}
                                                value={openingBuyPrice}
                                                onChange={setOpeningBuyPrice}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Stok Awal"
                                            validateStatus={
                                                errors.stock ? "error" : ""
                                            }
                                            help={
                                                errors.stock ||
                                                "Stok awal akan otomatis tercatat ke histori mutasi stok."
                                            }
                                        >
                                            <InputNumber
                                                min={0}
                                                style={{ width: "100%" }}
                                                value={stock}
                                                onChange={setStock}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </>
                        ) : isService ? (
                            <>
                                <Alert
                                    type="info"
                                    showIcon
                                    message="Produk layanan dijual dengan harga tetap. Stok bahan baku akan berkurang otomatis saat penjualan."
                                    style={{ marginBottom: 16 }}
                                />
                                <Row gutter={16}>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Harga Jual"
                                            validateStatus={
                                                errors.sell_price ? "error" : ""
                                            }
                                            help={errors.sell_price}
                                        >
                                            <InputNumber
                                                min={1}
                                                prefix="Rp"
                                                style={{ width: "100%" }}
                                                value={serviceSellPrice}
                                                onChange={setServiceSellPrice}
                                                placeholder="0"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Satuan Jual"
                                            validateStatus={
                                                errors.unit_id ? "error" : ""
                                            }
                                            help={errors.unit_id}
                                        >
                                            <Select
                                                placeholder="-- Pilih Satuan --"
                                                value={serviceUnitId}
                                                options={unitOptions}
                                                onChange={setServiceUnitId}
                                                style={{ width: "100%" }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <ProductComponentBuilder
                                    physicalProducts={physicalProducts}
                                    rows={components}
                                    onChange={setComponents}
                                    errors={errors}
                                />
                            </>
                        ) : (
                            <>
                                <Alert
                                    type="info"
                                    showIcon
                                    message="Produk PPOB tidak memerlukan harga beli/jual di katalog. Harga modal dan admin fee diinput saat penjualan di POS."
                                    style={{ marginBottom: 8 }}
                                />
                                <Alert
                                    type="info"
                                    showIcon
                                    message="Produk PPOB tidak menggunakan stok."
                                />
                            </>
                        )}

                        <Form.Item
                            label={
                                <>
                                    Deskripsi{" "}
                                    <Text type="secondary">(Opsional)</Text>
                                </>
                            }
                            validateStatus={errors.description ? "error" : ""}
                            help={errors.description}
                        >
                            <Input.TextArea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Masukkan deskripsi produk"
                            />
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
                                ULANGI
                            </Button>
                        </Space>
                    </form>
                </Card>

                {showBarcodeScanner && (
                    <BarcodeScanner
                        onScan={(value) => {
                            setBarcode(value);
                            setShowBarcodeScanner(false);
                        }}
                        onClose={() => setShowBarcodeScanner(false)}
                    />
                )}
            </LayoutAccount>
        </>
    );
}
