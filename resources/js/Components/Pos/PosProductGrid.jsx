import { Button, Empty, Input, Tag } from "antd";
import Pagination from "../../Shared/Pagination";
import useMobile from "../../Hooks/useMobile";
import {
    BoxPlotOutlined,
    PrinterOutlined,
    SearchOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import {
    serviceComponentBlocked,
    serviceComponentLow,
} from "./posUtils";

export default function PosProductGrid({
    searchInputRef,
    products,
    categories,
    categoryId,
    searchQuery,
    onSearchQueryChange,
    onSearch,
    onCategoryClick,
    onAddToCart,
    onOpenScanner,
    showScannerButton = false,
}) {
    const isMobile = useMobile();

    return (
        <section className="pos-sale-panel">
            <form className="pos-search-bar" onSubmit={onSearch}>
                <div className="pos-search-with-scanner">
                    <Input
                        ref={searchInputRef}
                        className="pos-search-input"
                        size="large"
                        prefix={<SearchOutlined />}
                        placeholder="Scan barcode atau cari produk"
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        autoFocus
                        addonAfter={
                            <Button type="primary" htmlType="submit">
                                Cari
                            </Button>
                        }
                    />
                    {showScannerButton && isMobile && (
                        <Button
                            type="default"
                            size="large"
                            className="barcode-scan-trigger"
                            aria-label="Buka scanner barcode"
                            onClick={onOpenScanner}
                        >
                            📷
                        </Button>
                    )}
                </div>
            </form>

            <div className="pos-category-strip">
                <button
                    type="button"
                    className={`pos-category-pill ${
                        String(categoryId) === "" ? "active" : ""
                    }`}
                    onClick={() => onCategoryClick("")}
                >
                    Semua
                </button>

                {categories.map((category) => (
                    <button
                        type="button"
                        key={category.id}
                        className={`pos-category-pill ${
                            String(categoryId) === String(category.id)
                                ? "active"
                                : ""
                        }`}
                        onClick={() => onCategoryClick(category.id)}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className="pos-torn-edge pos-torn-edge--down" aria-hidden="true" />

            <div
                className="pos-product-grid"
                style={
                    isMobile
                        ? {
                              gridTemplateColumns:
                                  "repeat(2, minmax(0, 1fr))",
                          }
                        : undefined
                }
            >
                {products.data.length > 0 ? (
                    products.data.map((product) => {
                        const isPpob = product.product_type === "ppob";
                        const isService = product.product_type === "service";
                        const defaultUnit =
                            product.default_sell_unit ||
                            product.product_units?.find((u) => u.is_default_sell);
                        const displayPrice =
                            defaultUnit?.sell_price ?? product.sell_price;
                        const componentBlocked =
                            isService && serviceComponentBlocked(product);
                        const disabled = isPpob
                            ? false
                            : isService
                              ? componentBlocked
                              : product.stock < 1;

                        return (
                            <button
                                type="button"
                                className={`pos-product-tile ${disabled ? "is-disabled" : ""}`}
                                key={product.id}
                                onClick={() => !disabled && onAddToCart(product)}
                                disabled={disabled}
                            >
                                <span className="pos-product-image">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                        />
                                    ) : isPpob ? (
                                        <ThunderboltOutlined />
                                    ) : isService ? (
                                        <PrinterOutlined />
                                    ) : (
                                        <BoxPlotOutlined />
                                    )}
                                    {disabled && (
                                        <span className="pos-product-empty">
                                            {isService ? "Bahan habis" : "Habis"}
                                        </span>
                                    )}
                                    {isPpob && (
                                        <Tag
                                            color="cyan"
                                            className="absolute top-0 right-0 m-1"
                                        >
                                            PPOB
                                        </Tag>
                                    )}
                                    {isService &&
                                        !disabled &&
                                        serviceComponentLow(product) && (
                                            <Tag
                                                color="warning"
                                                className="absolute top-0 right-0 m-1"
                                            >
                                                Bahan menipis
                                            </Tag>
                                        )}
                                    {isService && (
                                        <Tag
                                            className="absolute top-0 left-0 m-1"
                                        >
                                            Layanan
                                        </Tag>
                                    )}
                                </span>
                                <span className="pos-product-name">
                                    {product.title}
                                </span>
                                <span className="pos-product-meta">
                                    <span>
                                        {isPpob
                                            ? "Digital"
                                            : isService
                                              ? "Pakai bahan baku"
                                              : `Stok ${product.stock}`}
                                    </span>
                                    <strong>
                                        {isPpob
                                            ? "Modal+Fee"
                                            : formatRupiah(displayPrice)}
                                    </strong>
                                </span>
                            </button>
                        );
                    })
                ) : (
                    <div className="pos-empty-state">
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <>
                                    <strong>Produk tidak ditemukan</strong>
                                </>
                            }
                        />
                    </div>
                )}
            </div>

            {products.links.length > 0 && (
                <div className="pos-pagination">
                    <Pagination
                        links={products.links}
                        align="center"
                        meta={{
                            current_page: products.current_page,
                            per_page: products.per_page,
                            total: products.total,
                        }}
                    />
                </div>
            )}
        </section>
    );
}
