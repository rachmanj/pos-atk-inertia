export const lineDiscountAmount = (cart) => {
    const gross = Number(cart.price || 0) * Number(cart.qty || 0);
    const value = Number(cart.discount || 0);
    if (value <= 0 || gross <= 0) return 0;
    const amount =
        (cart.discount_type || "nominal") === "percent"
            ? Math.round((gross * value) / 100)
            : value;
    return Math.min(amount, gross);
};

export const lineNet = (cart) =>
    Number(cart.price || 0) * Number(cart.qty || 0) -
    lineDiscountAmount(cart);

export const serviceComponentBlocked = (product) => {
    const recipe = product.components || [];

    if (recipe.length === 0) {
        return true;
    }

    return recipe.some((row) => {
        const component = row.component_product || row.componentProduct;

        return (
            !component ||
            Number(component.stock || 0) < Number(row.qty_per_unit || 0)
        );
    });
};

export const serviceComponentLow = (product) => {
    const recipe = product.components || [];

    return recipe.some((row) => {
        const component = row.component_product || row.componentProduct;

        return component && Number(component.stock || 0) <= 10;
    });
};
