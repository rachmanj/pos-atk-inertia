export const MAX_PRODUCT_PRICE_RATIO = 10;

function priceRatio(productPrice, unitPrice) {
    return Math.max(unitPrice / productPrice, productPrice / unitPrice);
}

export function getProductPriceWarning(productPrice, unitPrice) {
    const product = Number(productPrice) || 0;
    const unit = Number(unitPrice) || 0;

    if (product <= 0 || unit <= 0 || product === unit) {
        return null;
    }

    if (priceRatio(product, unit) > MAX_PRODUCT_PRICE_RATIO) {
        return null;
    }

    const formatted = (value) =>
        new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    return `Harga satuan default (Rp ${formatted(unit)}) berbeda dari harga jual produk (Rp ${formatted(product)}). Pastikan memang disengaja.`;
}
