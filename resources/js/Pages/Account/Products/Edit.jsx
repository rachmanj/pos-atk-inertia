import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    Col,
    Flex,
    Form,
    Image,
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
    EditOutlined,
    HistoryOutlined,
    SaveOutlined,
    SwapOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import hasAnyPermission from "../../../Utils/Permissions";
import ProductUnitBuilder from "../../../Components/ProductUnitBuilder";
import ProductComponentBuilder from "../../../Components/ProductComponentBuilder";
import BarcodeScanner from "../../../Components/BarcodeScanner";
import useMobile from "../../../Hooks/useMobile";

const { Title, Text } = Typography;

export default function ProductEdit() {
    const {
        errors = {},
        categories = [],
        product,
        units = [],
        auth,
        physicalProducts = [],
    } = usePage().props;
    const allPermissions = auth?.permissions ?? {};

    const [barcode, setBarcode] = useState(product.barcode);
    const [title, setTitle] = useState(product.title);
    const [categoryId, setCategoryId] = useState(product.category_id);
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState(product.description || "");
    const [productType, setProductType] = useState(
        product.product_type || "physical",
    );
    const [productUnits, setProductUnits] = useState(
        (product.product_units || []).map((row) => ({
            unit_id: String(row.unit_id),
            conversion_factor: row.conversion_factor,
            sell_price: row.sell_price,
            is_base_unit: row.is_base_unit,
            is_default_sell: row.is_default_sell,
        })),
    );
    const [serviceSellPrice, setServiceSellPrice] = useState(
        product.sell_price || null,
    );
    const [serviceUnitId, setServiceUnitId] = useState(
        String(product.product_units?.[0]?.unit_id || units[0]?.id || ""),
    );
    const [components, setComponents] = useState(
        (product.components || []).length > 0
            ? product.components.map((row) => ({
                  component_product_id: String(row.component_product_id),
                  qty_per_unit: row.qty_per_unit,
                  note: row.note || "",
              }))
            : [{ component_product_id: "", qty_per_unit: 1, note: "" }],
    );
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

    const updateProduct = (e) => {
        e.preventDefault();
        setSaving(true);

        const data = {
            _method: "PUT",
            barcode,
            title,
            category_id: categoryId,
            description,
            product_type: productType,
            product_units: JSON.stringify(
                productUnits.map((row) => ({
                    ...row,
                    unit_id: Number(row.unit_id),
                    conversion_factor: Number(row.conversion_factor),
                    sell_price: Number(row.sell_price),
                })),
            ),
        };

        if (isService) {
            data.sell_price = serviceSellPrice;
            data.unit_id = serviceUnitId;
            data.components = JSON.stringify(
                components.map((row) => ({
                    component_product_id: Number(row.component_product_id),
                    qty_per_unit: Number(row.qty_per_unit || 0),
                    note: row.note || null,
                })),
            );
        }

        const hasNewImage = image instanceof File;
        if (hasNewImage) {
            data.image = image;
        }

        router.post(`/account/products/${product.id}`, data, {
            forceFormData: hasNewImage,
            onSuccess: () => {
                notification.success({
                    message: "Berhasil",
                    description: "Data berhasil diperbarui!",
                    duration: 2,
                });
            },
            onFinish: () => setSaving(false),
        });
    };

    return (
        <>
            <Head title="Edit Produk - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <EditOutlined style={{ marginRight: 8 }} />
                            EDIT PRODUK
                        </Title>
                    }
                    extra={
                        <Link href="/account/products">
                            <Button icon={<ArrowLeftOutlined />}>KEMBALI</Button>
                        </Link>
                    }
                >
                    <form onSubmit={updateProduct}>
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
                                        value={categoryId ?? undefined}
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
                                    label="Gambar Produk"
                                    validateStatus={errors.image ? "error" : ""}
                                    help={
                                        errors.image ||
                                        "Biarkan kosong jika tidak ingin mengubah gambar"
                                    }
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
                                            Pilih Gambar Baru
                                        </Button>
                                    </Upload>
                                    <Image
                                        src={product.image}
                                        alt="Produk Saat Ini"
                                        width={80}
                                        style={{
                                            marginTop: 8,
                                            borderRadius: 8,
                                        }}
                                        preview={false}
                                    />
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
                                        <Card size="small" style={{ marginBottom: 16 }}>
                                            <Text strong>
                                                Informasi Harga Modal
                                            </Text>
                                            <div style={{ marginTop: 8 }}>
                                                <Text type="secondary">
                                                    HPP (WAC):{" "}
                                                </Text>
                                                <Text strong>
                                                    Rp{" "}
                                                    {Number(
                                                        product.avg_cost || 0,
                                                    ).toLocaleString("id-ID")}
                                                </Text>
                                                <Text type="secondary">
                                                    {" "}
                                                    / {product.unit}
                                                </Text>
                                            </div>
                                            <div>
                                                <Text type="secondary">
                                                    Harga beli terakhir:{" "}
                                                </Text>
                                                <Text strong>
                                                    Rp{" "}
                                                    {Number(
                                                        product.buy_price || 0,
                                                    ).toLocaleString("id-ID")}
                                                </Text>
                                            </div>
                                            <Text
                                                type="secondary"
                                                style={{
                                                    display: "block",
                                                    marginTop: 8,
                                                    fontSize: 12,
                                                }}
                                            >
                                                HPP diperbarui otomatis dari
                                                pembelian. Harga jual diatur per
                                                satuan di tabel di atas.
                                            </Text>
                                        </Card>
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
                                                value={serviceUnitId || undefined}
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
                            <Alert
                                type="info"
                                showIcon
                                message="Produk PPOB tidak memerlukan harga beli/jual di katalog. Harga modal dan admin fee diinput saat penjualan di POS."
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        {!isService && (
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Card size="small" style={{ marginBottom: 16 }}>
                                        <Flex
                                            justify="space-between"
                                            align="center"
                                            wrap="wrap"
                                            gap={12}
                                        >
                                            <div>
                                                <Title
                                                    level={4}
                                                    style={{ margin: 0 }}
                                                >
                                                    {product.stock} {product.unit}
                                                </Title>
                                                <Text type="secondary">
                                                    Perubahan stok dicatat lewat
                                                    penyesuaian stok agar histori
                                                    tetap rapi.
                                                </Text>
                                            </div>
                                            <Space>
                                                {hasAnyPermission(
                                                    ["stock_movements.index"],
                                                    allPermissions,
                                                ) && (
                                                    <Link
                                                        href={`/account/stock-movements?q=${encodeURIComponent(product.barcode)}`}
                                                    >
                                                        <Button
                                                            size="small"
                                                            icon={
                                                                <HistoryOutlined />
                                                            }
                                                        >
                                                            RIWAYAT
                                                        </Button>
                                                    </Link>
                                                )}
                                                {hasAnyPermission(
                                                    ["stock_movements.create"],
                                                    allPermissions,
                                                ) && (
                                                    <Link
                                                        href={`/account/stock-movements/create?product_id=${product.id}`}
                                                    >
                                                        <Button
                                                            size="small"
                                                            icon={<SwapOutlined />}
                                                            style={{
                                                                background:
                                                                    "#f59e0b",
                                                                borderColor:
                                                                    "#f59e0b",
                                                            }}
                                                        >
                                                            SESUAIKAN
                                                        </Button>
                                                    </Link>
                                                )}
                                            </Space>
                                        </Flex>
                                    </Card>
                                </Col>
                            </Row>
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

                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={saving}
                        >
                            PERBARUI
                        </Button>
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
