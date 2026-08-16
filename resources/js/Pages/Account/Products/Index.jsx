import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link, router } from "@inertiajs/react";
import {
    Button,
    Card,
    Flex,
    Image,
    Modal,
    Space,
    Table,
    Tag,
    Typography,
    Upload,
    notification,
    theme,
} from "antd";
import {
    BoxPlotOutlined,
    DownloadOutlined,
    HistoryOutlined,
    PlusOutlined,
    PrinterOutlined,
    SwapOutlined,
    UploadOutlined,
    EditOutlined,
    FileExcelOutlined,
} from "@ant-design/icons";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";

const { Title, Text } = Typography;

export default function ProductIndex() {
    const { products, auth = {} } = usePage().props;
    const allPermissions = auth.permissions || {};
    const { token } = theme.useToken();

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importProcessing, setImportProcessing] = useState(false);

    const handlePrintSelected = () => {
        if (selectedRowKeys.length === 0) {
            notification.warning({
                message: "Peringatan",
                description:
                    "Pilih minimal 1 produk untuk dicetak barcodenya!",
            });
            return;
        }

        const queryParams = selectedRowKeys
            .map((id) => `product_ids[]=${id}`)
            .join("&");

        window.open(`/account/products/print-barcodes?${queryParams}`, "_blank");
    };

    const handleImportSubmit = () => {
        if (!importFile) {
            notification.warning({
                message: "Peringatan",
                description: "Pilih file Excel terlebih dahulu.",
            });
            return;
        }

        setImportProcessing(true);

        router.post(
            "/account/products/import",
            { file: importFile },
            {
                forceFormData: true,
                onFinish: () => {
                    setImportProcessing(false);
                    setShowImportModal(false);
                    setImportFile(null);
                },
            },
        );
    };

    const columns = [
        {
            title: "No.",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (products.current_page - 1) * products.per_page,
        },
        {
            title: "Barcode",
            width: 160,
            align: "center",
            onCell: () => ({
                style: {
                    background: token.colorBgElevated,
                },
            }),
            render: (_, product) =>
                product.barcode ? (
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: token.paddingXXS,
                            background: token.colorWhite,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: token.borderRadiusSM,
                        }}
                    >
                        <Image
                            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(product.barcode)}&scale=2&height=10&includetext&backgroundcolor=ffffff&barcolor=000000`}
                            alt={product.barcode}
                            height={40}
                            preview={false}
                            style={{ display: "block" }}
                        />
                    </div>
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
        {
            title: "Nama Produk",
            render: (_, product) => (
                <Text strong>{product.title}</Text>
            ),
        },
        {
            title: "Kategori",
            align: "center",
            render: (_, product) => product.category?.name,
        },
        {
            title: "Harga Jual (default)",
            align: "right",
            render: (_, product) =>
                product.product_type === "ppob" ? (
                    <Text type="secondary">-</Text>
                ) : (
                    <>
                        {formatRupiah(
                            product.default_sell_unit?.sell_price ??
                                product.sell_price,
                        )}
                        {(product.default_sell_unit?.unit?.abbreviation ||
                            product.unit) && (
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    /{" "}
                                    {product.default_sell_unit?.unit
                                        ?.abbreviation ?? product.unit}
                                </Text>
                            </div>
                        )}
                    </>
                ),
        },
        {
            title: "Stok",
            align: "center",
            render: (_, product) => (
                <Tag color={product.stock > 0 ? "success" : "error"}>
                    {product.stock > 0
                        ? `${product.stock} ${product.unit}`
                        : "Stok Habis"}
                </Tag>
            ),
        },
        {
            title: "Aksi",
            width: 140,
            align: "center",
            render: (_, product) => (
                <Space>
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
                                title="Koreksi Stok"
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["products.edit"], allPermissions) && (
                        <Link href={`/account/products/${product.id}/edit`}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                            />
                        </Link>
                    )}
                    {hasAnyPermission(["products.delete"], allPermissions) && (
                        <Delete URL="/account/products" id={product.id} />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Produk - VASIA Stationery" />

            <LayoutAccount>
                <Card
                    title={
                        <Title level={4} style={{ margin: 0 }}>
                            <BoxPlotOutlined style={{ marginRight: 8 }} />
                            PRODUK
                        </Title>
                    }
                    extra={
                        <Space wrap>
                            {hasAnyPermission(
                                ["stock_movements.index"],
                                allPermissions,
                            ) && (
                                <Link href="/account/stock-movements">
                                    <Button icon={<HistoryOutlined />}>
                                        RIWAYAT STOK
                                    </Button>
                                </Link>
                            )}
                            {hasAnyPermission(
                                ["stock_movements.create"],
                                allPermissions,
                            ) && (
                                <Link href="/account/stock-movements/create">
                                    <Button
                                        icon={<SwapOutlined />}
                                        style={{
                                            background: "#faad14",
                                            borderColor: "#faad14",
                                        }}
                                    >
                                        KOREKSI STOK
                                    </Button>
                                </Link>
                            )}
                            {hasAnyPermission(
                                ["products.create"],
                                allPermissions,
                            ) && (
                                <>
                                    <Button
                                        icon={<FileExcelOutlined />}
                                        onClick={() => setShowImportModal(true)}
                                    >
                                        IMPORT EXCEL
                                    </Button>
                                    <Link href="/account/products/create">
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                        >
                                            TAMBAH PRODUK
                                        </Button>
                                    </Link>
                                </>
                            )}
                            <Button
                                type="primary"
                                icon={<PrinterOutlined />}
                                onClick={handlePrintSelected}
                            >
                                CETAK BARCODE
                            </Button>
                        </Space>
                    }
                >
                    <div style={{ marginBottom: 16 }}>
                        <Search
                            URL="/account/products"
                            placeholder="Cari barcode atau nama produk..."
                        />
                    </div>

                    <Table
                        bordered
                        rowKey="id"
                        columns={columns}
                        dataSource={products.data}
                        pagination={false}
                        locale={{
                            emptyText:
                                "Belum ada produk. Tambahkan produk pertama untuk mulai menjual di POS.",
                        }}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: setSelectedRowKeys,
                        }}
                        scroll={{ x: "max-content" }}
                        style={{ width: "100%" }}
                    />

                    <Pagination
                        links={products.links}
                        meta={products}
                        align="end"
                    />
                </Card>

                <Modal
                    title={
                        <Space>
                            <FileExcelOutlined />
                            Import Produk dari Excel
                        </Space>
                    }
                    open={showImportModal}
                    onCancel={() => !importProcessing && setShowImportModal(false)}
                    onOk={handleImportSubmit}
                    okText="Import"
                    cancelText="Batal"
                    confirmLoading={importProcessing}
                    okButtonProps={{ icon: <UploadOutlined /> }}
                >
                    <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                        Unduh template, isi data produk, lalu unggah file .xlsx,
                        .xls, atau .csv. Barcode yang sudah ada akan dilewati.
                    </Text>

                    <Button
                        icon={<DownloadOutlined />}
                        href="/account/products/import/template"
                        style={{ marginBottom: 16 }}
                    >
                        Unduh Template Excel
                    </Button>

                    <Upload
                        accept=".xlsx,.xls,.csv"
                        maxCount={1}
                        beforeUpload={(file) => {
                            setImportFile(file);
                            return false;
                        }}
                        onRemove={() => setImportFile(null)}
                    >
                        <Button icon={<UploadOutlined />}>Pilih File Excel</Button>
                    </Upload>
                </Modal>
            </LayoutAccount>
        </>
    );
}
