import { useEffect, useRef, useState } from "react";
import { Button, Input, Tag } from "antd";
import { MinusOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import {
    serviceComponentBlocked,
    serviceComponentLow,
} from "./posUtils";

const SEARCH_DEBOUNCE_MS = 200;
const MAX_RESULTS = 50;
const QTY_PRESETS = [1, 5, 10, 20, 50];

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
    const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);
    const [quickQty, setQuickQty] = useState(1);
    const trimmedQuery = searchQuery.trim();
    const hasQuery = trimmedQuery.length > 0;
    const visibleProducts = hasQuery
        ? products.data.slice(0, MAX_RESULTS)
        : [];
    const totalFound = products.total ?? visibleProducts.length;
    const shownCount = visibleProducts.length;
    const showQuickPanel = !hasQuery && quickProducts.length > 0;

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
                            ← Kembali
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
                <p className="pos-quick-products-heading">Produk Cepat</p>
                <div className="pos-quick-products-grid">
                    {quickProducts.map((quickProduct) => {
                        const isPpob = quickProduct.product_type === "ppob";
                        const isService = quickProduct.product_type === "service";
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
                                    !disabled && handleQuickProductClick(quickProduct)
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
            </div>
        );
    };

    return (
        <section className="pos-search-section">
            <form
                className="pos-search-bar"
                onSubmit={(e) => e.preventDefault()}
            >
                <div className="pos-search-with-scanner">
                    <Input
                        ref={searchInputRef}
                        className="pos-search-input"
                        size="large"
                        prefix={<SearchOutlined />}
                        placeholder="Ketik nama produk atau scan barcode..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        autoFocus
                        allowClear
                    />
                    {showScannerButton && (
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

            <div
                className={`pos-search-results-area${hasQuery && visibleProducts.length > 0 ? " pos-search-results-area--dropdown" : ""}`}
            >
                {showQuickPanel ? (
                    renderQuickPanel()
                ) : !hasQuery ? (
                    <p className="pos-search-hint">
                        Ketik nama produk atau scan barcode untuk mencari
                    </p>
                ) : visibleProducts.length === 0 ? (
                    <p className="pos-search-empty">
                        Tidak ada produk cocok dengan &lsquo;{trimmedQuery}
                        &rsquo;
                    </p>
                ) : (
                    <>
                        <p className="pos-search-hint">
                            {totalFound} produk ditemukan
                            {totalFound > shownCount
                                ? ` — ${shownCount} ditampilkan`
                                : ""}
                            . Boleh beberapa kata, urutan bebas (mis: cover
                            kecil).
                        </p>
                        <ul className="pos-search-result-list" role="listbox">
                        {visibleProducts.map((product) => {
                            const isPpob = product.product_type === "ppob";
                            const isService = product.product_type === "service";
                            const defaultUnit =
                                product.default_sell_unit ||
                                product.product_units?.find(
                                    (u) => u.is_default_sell,
                                );
                            const displayPrice =
                                defaultUnit?.sell_price ?? product.sell_price;
                            const componentBlocked =
                                isService && serviceComponentBlocked(product);
                            const disabled = isService && componentBlocked;
                            const outOfStock =
                                !isPpob &&
                                !isService &&
                                Number(product.stock ?? 0) < 1;
                            const priceLabel = isPpob
                                ? "Modal+Fee"
                                : formatRupiah(displayPrice);

                            return (
                                <li key={product.id} role="option">
                                    <button
                                        type="button"
                                        className={`pos-search-result-item ${disabled ? "is-disabled" : ""}`}
                                        onClick={() =>
                                            handleProductClick(product, disabled)
                                        }
                                        disabled={disabled}
                                    >
                                        <span className="pos-search-result-name">
                                            {product.title}
                                            <span className="pos-search-result-badges">
                                                {renderProductBadges(product, {
                                                    isPpob,
                                                    isService,
                                                    disabled,
                                                    outOfStock,
                                                })}
                                            </span>
                                        </span>
                                        <span className="pos-search-result-price">
                                            {priceLabel}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                        </ul>
                    </>
                )}
            </div>
        </section>
    );
}
