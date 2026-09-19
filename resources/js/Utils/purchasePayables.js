import dayjs from "dayjs";

export const purchasePaymentStatusMeta = {
    unpaid: { label: "Belum Bayar", color: "error" },
    partial: { label: "Sebagian", color: "warning" },
    paid: { label: "Lunas", color: "success" },
};

export function purchasePaymentStatusLabel(status) {
    return purchasePaymentStatusMeta[status]?.label || status || "-";
}

export function purchasePaymentStatusColor(status) {
    return purchasePaymentStatusMeta[status]?.color || "default";
}

export const purchasePaymentMethodLabels = {
    tunai: "Tunai",
    transfer: "Transfer",
    lainnya: "Lainnya",
};

export function formatPurchasePaymentMethod(method) {
    return purchasePaymentMethodLabels[method] || method || "-";
}

export function formatPurchasePaymentTerm(paymentTermDays, dueDate) {
    if (paymentTermDays === 0) {
        return "Tunai / N0";
    }

    if (paymentTermDays != null && paymentTermDays !== "") {
        return `N${paymentTermDays}`;
    }

    if (dueDate) {
        return "Tanggal manual";
    }

    return "-";
}

export function computeDueDateFromPaymentTerm(
    purchaseDate,
    termPreset,
    manualDueDate,
) {
    if (!purchaseDate) {
        return null;
    }

    if (termPreset === "0") {
        return null;
    }

    if (termPreset === "manual") {
        return manualDueDate || null;
    }

    const days = Number(termPreset);
    if (Number.isNaN(days)) {
        return null;
    }

    return dayjs(purchaseDate).add(days, "day").format("YYYY-MM-DD");
}

export function formatPurchaseDueDate(value) {
    if (!value) {
        return "-";
    }

    const parsed = dayjs(value);
    if (!parsed.isValid()) {
        return "-";
    }

    return parsed.toDate().toLocaleDateString("id-ID");
}

export function purchaseOverdueDays(dueDate, paymentStatus) {
    if (!dueDate || paymentStatus === "paid") {
        return 0;
    }

    const due = dayjs(dueDate).startOf("day");
    const today = dayjs().startOf("day");

    if (due.isBefore(today)) {
        return today.diff(due, "day");
    }

    return 0;
}

export function purchasePaymentTermPayload(termPreset, manualDueDate) {
    if (termPreset === "manual") {
        return manualDueDate || "";
    }

    return termPreset;
}

export const PAYMENT_TERM_PRESET_OPTIONS = [
    { value: "0", label: "Tunai / N0" },
    { value: "14", label: "N14" },
    { value: "30", label: "N30" },
    { value: "60", label: "N60" },
    { value: "manual", label: "Tanggal manual" },
];
