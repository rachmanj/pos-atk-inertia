import { useEffect, useRef } from "react";
import { Button, Input, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import {
    serviceComponentBlocked,
    serviceComponentLow,
} from "./posUtils";

const SEARCH_DEBOUNCE_MS = 200;
const MAX_RESULTS = 10;

export default function PosProductGrid({
    searchInputRef,
    products,
    searchQuery,
    onSearchQueryChange,
    onSearchDebounced,
    onAddToCart,
    onOpenScanner,
    showScannerButton = false,
}) {
    const debounceRef = useRef(null);
    const trimmedQuery = searchQuery.trim();
    const hasQuery = trimmedQuery.length > 0;
    const visibleProducts = hasQuery
        ? products.data.slice(0, MAX_RESULTS)
        : [];

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
                {!hasQuery ? (
                    <p className="pos-search-hint">
                        Ketik nama produk atau scan barcode untuk mencari
                    </p>
                ) : visibleProducts.length === 0 ? (
                    <p className="pos-search-empty">
                        Tidak ada produk cocok dengan &lsquo;{trimmedQuery}
                        &rsquo;
                    </p>
                ) : (
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
                )}
            </div>
        </section>
    );
}
