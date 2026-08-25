import { useState } from "react";
import { Button, Empty, Input, Segmented, Tag } from "antd";
import Pagination from "../../Shared/Pagination";
import useMobile from "../../Hooks/useMobile";
import {
    AppstoreOutlined,
    BoxPlotOutlined,
    PrinterOutlined,
    SearchOutlined,
    ThunderboltOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import {
    serviceComponentBlocked,
    serviceComponentLow,
} from "./posUtils";

const VIEW_MODE_STORAGE_KEY = "pos-view-mode";

function getInitialViewMode() {
    if (typeof window === "undefined") {
        return "list";
    }
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "grid" ? "grid" : "list";
}

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
    const [viewMode, setViewMode] = useState(getInitialViewMode);

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    };

    const renderProductBadges = (product, { isPpob, isService, disabled, outOfStock }) => (
        <>
            {(disabled || outOfStock) && (
                <Tag color="error" className="pos-product-badge">
                    {isService ? "Bahan habis" : "Habis"}
                </Tag>
            )}
            {isPpob && (
                <Tag color="cyan" className="pos-product-badge">
                    PPOB
                </Tag>
            )}
            {isService && !disabled && serviceComponentLow(product) && (
                <Tag color="warning" className="pos-product-badge">
                    Bahan menipis
                </Tag>
            )}
            {isService && (
                <Tag className="pos-product-badge">Layanan</Tag>
            )}
        </>
    );

    const renderProducts = () => {
        if (products.data.length === 0) {
            return (
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
            );
        }

        return products.data.map((product) => {
            const isPpob = product.product_type === "ppob";
            const isService = product.product_type === "service";
            const defaultUnit =
                product.default_sell_unit ||
                product.product_units?.find((u) => u.is_default_sell);
            const displayPrice =
                defaultUnit?.sell_price ?? product.sell_price;
            const componentBlocked =
                isService && serviceComponentBlocked(product);
            const disabled = isService && componentBlocked;
            const outOfStock =
                !isPpob && !isService && Number(product.stock ?? 0) < 1;
            const metaLabel = isPpob
                ? "Digital"
                : isService
                  ? "Pakai bahan baku"
                  : `Stok ${product.stock}`;
            const priceLabel = isPpob
                ? "Modal+Fee"
                : formatRupiah(displayPrice);

            if (viewMode === "list") {
                return (
                    <button
                        type="button"
                        className={`pos-product-list-row ${disabled ? "is-disabled" : ""}`}
                        key={product.id}
                        onClick={() => !disabled && onAddToCart(product)}
                        disabled={disabled}
                    >
                        <span className="pos-product-list-info">
                            <span className="pos-product-list-name-row">
                                <span className="pos-product-list-name">
                                    {product.title}
                                </span>
                                <span className="pos-product-list-badges">
                                    {renderProductBadges(product, {
                                        isPpob,
                                        isService,
                                        disabled,
                                        outOfStock,
                                    })}
                                </span>
                            </span>
                            <span className="pos-product-list-meta">
                                {metaLabel}
                            </span>
                        </span>
                        <span className="pos-product-list-price">
                            {priceLabel}
                        </span>
                    </button>
                );
            }

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
                        {(disabled || outOfStock) && (
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
                            <Tag className="absolute top-0 left-0 m-1">
                                Layanan
                            </Tag>
                        )}
                    </span>
                    <span className="pos-product-name">
                        {product.title}
                    </span>
                    <span className="pos-product-meta">
                        <span>{metaLabel}</span>
                        <strong>{priceLabel}</strong>
                    </span>
                </button>
            );
        });
    };

    return (
        <section className="pos-sale-panel">
            <form className="pos-search-bar" onSubmit={onSearch}>
                <div className="pos-search-toolbar">
                    <Segmented
                        className="pos-view-toggle"
                        value={viewMode}
                        onChange={handleViewModeChange}
                        options={[
                            {
                                label: "List",
                                value: "list",
                                icon: <UnorderedListOutlined />,
                            },
                            {
                                label: "Grid",
                                value: "grid",
                                icon: <AppstoreOutlined />,
                            },
                        ]}
                    />
                </div>
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
                className={
                    viewMode === "list" ? "pos-product-list" : "pos-product-grid"
                }
                style={
                    viewMode === "grid" && isMobile
                        ? {
                              gridTemplateColumns:
                                  "repeat(2, minmax(0, 1fr))",
                          }
                        : undefined
                }
            >
                {renderProducts()}
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
