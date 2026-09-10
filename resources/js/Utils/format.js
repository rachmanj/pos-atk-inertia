export const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

export const formatRupiahCompact = (value) => {
    const num = Number(value) || 0;
    const abs = Math.abs(num);

    if (abs >= 1_000_000) {
        const jt = num / 1_000_000;
        const formatted = new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: jt % 1 === 0 ? 0 : 1,
            maximumFractionDigits: 1,
        }).format(jt);

        return `Rp ${formatted} jt`;
    }

    if (abs >= 1_000) {
        const rb = num / 1_000;
        const formatted = new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: rb % 1 === 0 ? 0 : 1,
            maximumFractionDigits: 1,
        }).format(rb);

        return `Rp ${formatted} rb`;
    }

    return formatRupiah(num);
};
