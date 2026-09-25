import { useEffect, useRef, useState } from "react";
import { Button, Input, Tag } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import Pagination from "../../Shared/Pagination";
import useMobile from "../../Hooks/useMobile";
import { formatRupiah } from "../../Utils/format";
import {
    serviceComponentBlocked,
    serviceComponentLow,
} from "./posUtils";

const SEARCH_DEBOUNCE_MS = 200;
const QTY_PRESETS = [1, 5, 10, 20, 50];
const VIEW_MODE_STORAGE_KEY = "pos-view-mode-b";

function BarcodeScanIcon() {
    return (
        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
        >
            <path d="M3 5v14M7 5v14M11 5v9M15 5v14M19 5v14" />
        </svg>
    );
}

function getInitialViewMode() {
    if (typeof window === "undefined") {
        return "kartu";
    }
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "daftar" ? "daftar" : "kartu";
}

function categoryCardClass(categoryName) {
    const name = (categoryName || "").toLowerCase();
    if (name.includes("kertas")) return "pos-product-card--kertas";
    if (name.includes("pulpen") || name.includes("pensil")) {
        return "pos-product-card--pulpen";
    }
    if (name.includes("kuas") || name.includes("cat")) {
        return "pos-product-card--seni";
    }
    return "pos-product-card--default";
}

export default function PosProductGrid({
    searchInputRef,
    products,
    quickProducts = [],
    searchQuery,
    onSearchQueryChange,
    onSearchDebounced,
    onAddToCart,
    onAddToCartWithQty,
    onOpenScanner,
    showScannerButton = false,
}) {
    const debounceRef = useRef(null);
    const isMobile = useMobile();
    const [viewMode, setViewMode] = useState(getInitialViewMode);
    const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);
    const [quickQty, setQuickQty] = useState(1);
    const trimmedQuery = searchQuery.trim();
    const hasQuery = trimmedQuery.length > 0;
    const catalogProducts = products.data || [];

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!hasQuery) {
            return;
        }

        debounceRef.current = setTimeout(() => {
            onSearchDebounced?.(trimmedQuery);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [trimmedQuery, hasQuery, onSearchDebounced]);

    useEffect(() => {
        if (hasQuery) {
            setSelectedQuickProduct(null);
            setQuickQty(1);
        }
    }, [hasQuery]);

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    };

    const renderProductBadges = (
        product,
        { isPpob, isService, disabled, outOfStock },
    ) => (
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

    const handleProductClick = (product, disabled) => {
        if (disabled) return;
        onAddToCart(product);
    };

    const toCartProduct = (quickProduct) => ({
        id: quickProduct.id,
        title: quickProduct.title,
        product_type: quickProduct.product_type,
        sell_price: quickProduct.sell_price,
        stock: quickProduct.stock,
        default_sell_unit: quickProduct.default_sell_unit,
        product_units: quickProduct.product_units || [],
        components: quickProduct.components || [],
    });

    const handleQuickProductClick = (quickProduct) => {
        const product = toCartProduct(quickProduct);
        const isPpob = product.product_type === "ppob";
        const unitCount = quickProduct.unit_count ?? product.product_units.length;

        if (isPpob || unitCount > 1) {
            onAddToCart(product);
            return;
        }

        setSelectedQuickProduct(quickProduct);
        setQuickQty(1);
    };

    const handleQuickQtyChange = (nextQty) => {
        setQuickQty(Math.max(1, nextQty));
    };

    const handleQuickQtyAdd = () => {
        if (!selectedQuickProduct) return;

        const addWithQty = onAddToCartWithQty || onAddToCart;
        addWithQty(toCartProduct(selectedQuickProduct), quickQty);
        setSelectedQuickProduct(null);
        setQuickQty(1);
    };

    const renderQuickPrice = (quickProduct) =>
        quickProduct.product_type === "ppob"
            ? "Modal+Fee"
            : formatRupiah(quickProduct.sell_price);

    const renderQuickPanel = () => {
        if (selectedQuickProduct) {
            const priceLabel = formatRupiah(
                selectedQuickProduct.sell_price * quickQty,
            );

            return (
                <div className="pos-quick-qty-panel">
                    <div className="pos-quick-qty-header">
                        <button
                            type="button"
                            className="pos-quick-qty-back"
                            onClick={() => {
                                setSelectedQuickProduct(null);
                                setQuickQty(1);
                            }}
                        >
                            Kembali
                        </button>
                        <span className="pos-quick-qty-title">
                            {selectedQuickProduct.title}
                        </span>
                    </div>

                    <div className="pos-quick-qty-controls">
                        <Button
                            type="default"
                            size="large"
                            icon={<MinusOutlined />}
                            aria-label="Kurangi jumlah"
                            onClick={() => handleQuickQtyChange(quickQty - 1)}
                            disabled={quickQty <= 1}
                        />
                        <span className="pos-quick-qty-value">{quickQty}</span>
                        <Button
                            type="default"
                            size="large"
                            icon={<PlusOutlined />}
                            aria-label="Tambah jumlah"
                            onClick={() => handleQuickQtyChange(quickQty + 1)}
                        />
                    </div>

                    <div className="pos-quick-qty-presets">
                        {QTY_PRESETS.map((preset) => (
                            <Button
                                key={preset}
                                type={quickQty === preset ? "primary" : "default"}
                                onClick={() => setQuickQty(preset)}
                            >
                                {preset}
                            </Button>
                        ))}
                    </div>

                    <div className="pos-quick-qty-footer">
                        <span className="pos-quick-qty-subtotal">{priceLabel}</span>
                        <Button type="primary" size="large" onClick={handleQuickQtyAdd}>
                            Tambah
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="pos-quick-products">
                <p className="pos-quick-products-heading">
                    Produk Cepat
                </p>
                {quickProducts.length === 0 ? (
                    <p className="pos-quick-products-empty">
                        Belum ada produk cepat. Tandai produk dari Master
                        Produk.
                    </p>
                ) : (
                    <div className="pos-quick-products-grid">
                        {quickProducts.map((quickProduct) => {
                            const isPpob = quickProduct.product_type === "ppob";
                            const isService =
                                quickProduct.product_type === "service";
                            const componentBlocked =
                                isService &&
                                serviceComponentBlocked(toCartProduct(quickProduct));
                            const disabled = isService && componentBlocked;
                            const outOfStock =
                                !isPpob &&
                                !isService &&
                                Number(quickProduct.stock ?? 0) < 1;

                            return (
                                <button
                                    key={quickProduct.id}
                                    type="button"
                                    className={`pos-quick-product-card ${disabled ? "is-disabled" : ""}`}
                                    onClick={() =>
                                        !disabled &&
                                        handleQuickProductClick(quickProduct)
                                    }
                                    disabled={disabled}
                                >
                                    <span className="pos-quick-product-name">
                                        {quickProduct.title}
                                        {(disabled || outOfStock || isPpob) && (
                                            <span className="pos-quick-product-badges">
                                                {renderProductBadges(
                                                    toCartProduct(quickProduct),
                                                    {
                                                        isPpob,
                                                        isService,
                                                        disabled,
                                                        outOfStock,
                                                    },
                                                )}
                                            </span>
                                        )}
                                    </span>
                                    <span className="pos-quick-product-price">
                                        {renderQuickPrice(quickProduct)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderProductCard = (product) => {
        const isPpob = product.product_type === "ppob";
        const isService = product.product_type === "service";
        const defaultUnit =
            product.default_sell_unit ||
            product.product_units?.find((u) => u.is_default_sell);
        const displayPrice = defaultUnit?.sell_price ?? product.sell_price;
        const unitLabel =
            defaultUnit?.unit?.abbreviation ||
            product.unit ||
            product.product_units?.[0]?.unit?.abbreviation ||
            "pcs";
        const componentBlocked =
            isService && serviceComponentBlocked(product);
        const disabled = isService && componentBlocked;
        const stock = Number(product.stock ?? 0);
        const outOfStock = !isPpob && !isService && stock < 1;
        const priceLabel = isPpob ? "Modal+Fee" : formatRupiah(displayPrice);
        const categoryName = product.category?.name || "Umum";
        const stockLow = !isPpob && !isService && stock <= 8;

        if (viewMode === "daftar") {
            return (
                <button
                    type="button"
                    className={`pos-product-list-row ${disabled ? "is-disabled" : ""}`}
                    key={product.id}
                    onClick={() => handleProductClick(product, disabled)}
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
                            {categoryName}
                            {!isPpob && !isService
                                ? ` · Stok ${stock}`
                                : ""}
                        </span>
                    </span>
                    <span className="pos-product-list-price">{priceLabel}</span>
                </button>
            );
        }

        return (
            <button
                type="button"
                className={`pos-product-card ${categoryCardClass(categoryName)} ${disabled ? "is-disabled" : ""}`}
                key={product.id}
                onClick={() => handleProductClick(product, disabled)}
                disabled={disabled}
            >
                <span className="pos-product-card-cat">{categoryName}</span>
                <span className="pos-product-card-name">{product.title}</span>
                <span className="pos-product-card-bottom">
                    <span className="pos-product-card-price">
                        {priceLabel}
                        {!isPpob && (
                            <small> /{unitLabel}</small>
                        )}
                    </span>
                    {!isPpob && !isService && (
                        <span
                            className={`pos-product-card-stock${stockLow ? " is-low" : ""}`}
                        >
                            {stock} {unitLabel}
                        </span>
                    )}
                    {(isPpob || isService) && (
                        <span className="pos-product-card-badges">
                            {renderProductBadges(product, {
                                isPpob,
                                isService,
                                disabled,
                                outOfStock,
                            })}
                        </span>
                    )}
                </span>
            </button>
        );
    };

    const renderCatalog = () => {
        if (hasQuery && catalogProducts.length === 0) {
            return (
                <p className="pos-catalog-empty">
                    Tidak ada produk dengan kata kunci &lsquo;{trimmedQuery}
                    &rsquo;.
                    <br />
                    Periksa ejaan, atau scan barcodenya langsung.
                </p>
            );
        }

        if (!hasQuery && catalogProducts.length === 0) {
            return (
                <p className="pos-catalog-empty">
                    Belum ada produk aktif untuk ditampilkan di katalog.
                </p>
            );
        }

        if (viewMode === "daftar") {
            return (
                <div className="pos-product-list">
                    {catalogProducts.map((product) => renderProductCard(product))}
                </div>
            );
        }

        return (
            <div className="pos-product-grid pos-product-grid--cards">
                {catalogProducts.map((product) => renderProductCard(product))}
            </div>
        );
    };

    return (
        <section className="pos-left-panel">
            <form
                className="pos-search-bar"
                onSubmit={(e) => e.preventDefault()}
            >
                <div className="pos-scan-row">
                    <div className="pos-scan-input-wrap">
                        <span className="pos-scan-icon" aria-hidden="true">
                            <BarcodeScanIcon />
                        </span>
                        <Input
                            ref={searchInputRef}
                            className="pos-search-input pos-scan-input"
                            size="large"
                            placeholder="Scan barcode di sini, atau ketik nama produk"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            autoFocus
                            allowClear
                        />
                    </div>
                    <div
                        className="pos-view-toggle"
                        role="group"
                        aria-label="Tampilan produk"
                    >
                        <button
                            type="button"
                            aria-pressed={viewMode === "kartu"}
                            className={viewMode === "kartu" ? "is-active" : ""}
                            onClick={() => handleViewModeChange("kartu")}
                        >
                            Kartu
                        </button>
                        <button
                            type="button"
                            aria-pressed={viewMode === "daftar"}
                            className={viewMode === "daftar" ? "is-active" : ""}
                            onClick={() => handleViewModeChange("daftar")}
                        >
                            Daftar
                        </button>
                    </div>
                    {showScannerButton && isMobile && (
                        <Button
                            type="default"
                            size="large"
                            className="barcode-scan-trigger"
                            aria-label="Buka scanner barcode"
                            onClick={onOpenScanner}
                        >
                            Kamera
                        </Button>
                    )}
                </div>
            </form>

            <div className="pos-left-panel-body">
                {renderQuickPanel()}
                {renderCatalog()}

                {products.links?.length > 0 && (
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
            </div>
        </section>
    );
}
