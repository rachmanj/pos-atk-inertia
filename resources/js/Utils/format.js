const ID_DATE_ONLY_OPTIONS = { dateStyle: "medium" };

function toLocalDate(value) {
    if (value == null || value === "") {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const str = String(value).trim();
    if (!str) {
        return null;
    }

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
    if (dateOnlyMatch) {
        const date = new Date(
            Number(dateOnlyMatch[1]),
            Number(dateOnlyMatch[2]) - 1,
            Number(dateOnlyMatch[3]),
        );
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const dateTimeSpaceMatch =
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/.exec(str);
    if (dateTimeSpaceMatch) {
        const date = new Date(
            Number(dateTimeSpaceMatch[1]),
            Number(dateTimeSpaceMatch[2]) - 1,
            Number(dateTimeSpaceMatch[3]),
            Number(dateTimeSpaceMatch[4]),
            Number(dateTimeSpaceMatch[5]),
            Number(dateTimeSpaceMatch[6]),
        );
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(str);
    return Number.isNaN(date.getTime()) ? null : date;
}

export const formatDateOnly = (value) => {
    const date = toLocalDate(value);
    if (!date) {
        return "-";
    }

    return date.toLocaleDateString("id-ID", ID_DATE_ONLY_OPTIONS);
};

export const formatDateSafe = formatDateOnly;

export const normalizeDateInput = (value) => {
    const date = toLocalDate(value);
    if (!date) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

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

// Label ringkas untuk sumbu chart: "1,2 jt" / "76 rb" (tanpa prefix Rp, locale Indonesia)
export const formatRupiahAxis = (value) => {
    const num = Number(value) || 0;
    const abs = Math.abs(num);

    if (abs >= 1_000_000) {
        return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(num / 1_000_000)} jt`;
    }

    if (abs >= 1_000) {
        return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(num / 1_000)} rb`;
    }

    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(num);
};
