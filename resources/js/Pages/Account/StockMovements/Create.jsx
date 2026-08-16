import React, { useEffect, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND, NEUTRAL, SEMANTIC } from "../../../theme/colors";
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
    Spin,
    Statistic,
    Typography,
} from "antd";
import {
    AppstoreOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function StockMovementCreate() {
    const {
        products = [],
        selectedProductId,
        errors = {},
        flash = {},
    } = usePage().props;
    const loading = useInertiaLoading();

    const fallbackProductId = products[0]?.id ? String(products[0].id) : "";

    const [productId, setProductId] = useState(
        selectedProductId ? String(selectedProductId) : fallbackProductId,
    );
    const [targetStock, setTargetStock] = useState("");
    const [note, setNote] = useState("");

    useEffect(() => {
        const nextProductId = selectedProductId
            ? String(selectedProductId)
            : fallbackProductId;

        setProductId(nextProductId);
        setTargetStock("");
        setNote("");
    }, [selectedProductId, fallbackProductId]);

    const selectedProduct = products.find(
        (product) => String(product.id) === String(productId),
    );

    const currentStock = Number(selectedProduct?.stock ?? 0);
    const unit = selectedProduct?.unit || "pcs";
    const targetStockNumber = Number(targetStock);
    const hasTargetStock =
        targetStock !== "" && !Number.isNaN(targetStockNumber);
    const estimatedStock = hasTargetStock
        ? Math.max(0, targetStockNumber)
        : null;
    const correctionQty = hasTargetStock
        ? Math.abs(estimatedStock - currentStock)
        : 0;
    const hasStockChange = hasTargetStock && estimatedStock !== currentStock;
    const correctionLabel = !hasTargetStock
        ? "Isi stok target"
        : !hasStockChange
          ? "Belum ada perubahan"
          : estimatedStock > currentStock
            ? "Koreksi tambah"
            : "Koreksi kurang";

    const storeMovement = (e) => {
        e.preventDefault();

        if (!selectedProduct || !hasStockChange) {
            return;
        }

        router.post("/account/stock-movements", {
            product_id: productId,
            type: "adjustment",
            target_stock: targetStock,
            note: note,
        });
    };

    return (
        <>
            <Head>
                <title>Koreksi Stok - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <AppstoreOutlined
                                    style={{ color: BRAND.primary }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    KOREKSI STOK
                                </Title>
                            </Space>
                        }
                        extra={
                            <Link href="/account/stock-movements">
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
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        {products.length === 0 && (
                            <Alert
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="Belum ada produk"
                                description="Tambahkan produk terlebih dahulu sebelum membuat koreksi stok."
                            />
                        )}

                        <form onSubmit={storeMovement}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} lg={14}>
                                    <Form.Item
                                        label="Produk"
                                        validateStatus={
                                            errors.product_id ? "error" : ""
                                        }
                                        help={errors.product_id}
                                        required
                                    >
                                        <Select
                                            value={productId || undefined}
                                            onChange={(value) => {
                                                setProductId(value);
                                                setTargetStock("");
                                            }}
                                            disabled={products.length === 0}
                                            options={products.map((product) => ({
                                                value: String(product.id),
                                                label: `${product.title} - ${product.barcode}`,
                                            }))}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Stok Fisik / Target"
                                        validateStatus={
                                            errors.target_stock ? "error" : ""
                                        }
                                        help={errors.target_stock}
                                        required
                                    >
                                        <InputNumber
                                            min={0}
                                            style={{ width: "100%" }}
                                            value={
                                                targetStock === ""
                                                    ? null
                                                    : Number(targetStock)
                                            }
                                            onChange={(value) =>
                                                setTargetStock(
                                                    value != null
                                                        ? String(value)
                                                        : "",
                                                )
                                            }
                                            disabled={!selectedProduct}
                                            placeholder="Masukkan stok fisik/target"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Catatan"
                                        validateStatus={
                                            errors.note ? "error" : ""
                                        }
                                        help={errors.note}
                                    >
                                        <Input.TextArea
                                            rows={4}
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                            placeholder="Contoh: barang rusak, selisih hitung fisik kecil, koreksi input stok awal"
                                            disabled={!selectedProduct}
                                        />
                                    </Form.Item>

                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                        disabled={
                                            !selectedProduct || !hasStockChange
                                        }
                                    >
                                        SIMPAN KOREKSI
                                    </Button>
                                </Col>

                                <Col xs={24} lg={10}>
                                    <Card
                                        size="small"
                                        title="PRATINJAU STOK"
                                        style={{
                                            background: NEUTRAL.slate50,
                                        }}
                                    >
                                        <Space
                                            direction="vertical"
                                            size="middle"
                                            style={{ width: "100%" }}
                                        >
                                            <div>
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    Produk
                                                </Text>
                                                <br />
                                                <Text strong>
                                                    {selectedProduct?.title ||
                                                        "-"}
                                                </Text>
                                                <br />
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {selectedProduct?.barcode ||
                                                        "-"}
                                                </Text>
                                            </div>

                                            <Row gutter={12}>
                                                <Col span={12}>
                                                    <Card size="small">
                                                        <Statistic
                                                            title="Stok Sistem"
                                                            value={currentStock}
                                                            suffix={unit}
                                                        />
                                                    </Card>
                                                </Col>
                                                <Col span={12}>
                                                    <Card size="small">
                                                        <Statistic
                                                            title="Estimasi Setelah"
                                                            value={
                                                                hasTargetStock
                                                                    ? estimatedStock
                                                                    : "-"
                                                            }
                                                            suffix={unit}
                                                            valueStyle={{
                                                                color: SEMANTIC.success,
                                                            }}
                                                        />
                                                    </Card>
                                                </Col>
                                            </Row>

                                            <Card size="small">
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    Jenis Koreksi
                                                </Text>
                                                <br />
                                                <Text strong>
                                                    {correctionLabel}
                                                </Text>
                                                <br />
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    Selisih: {correctionQty}{" "}
                                                    {unit}
                                                </Text>
                                            </Card>
                                        </Space>
                                    </Card>
                                </Col>
                            </Row>
                        </form>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
