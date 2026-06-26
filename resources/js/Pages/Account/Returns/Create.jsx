import LayoutAccount from "../../../Layouts/Account";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Create() {
    const { transaction, returnableItems = [], errors = {} } = usePage().props;

    const [reason, setReason] = useState("customer_request");
    const [note, setNote] = useState("");
    const [items, setItems] = useState(
        returnableItems.map((item) => ({
            product_id: item.product_id,
            qty: 0,
            restock: true,
            remaining_qty: item.remaining_qty,
            price: item.price,
            product_title: item.product_title,
        })),
    );

    const handleQtyChange = (productId, value) => {
        const parsedQty = Number(value || 0);
        const qty = Number.isFinite(parsedQty) ? Math.floor(parsedQty) : 0;

        setItems((currentItems) =>
            currentItems.map((item) => {
                if (item.product_id !== productId) {
                    return item;
                }

                const safeQty = Math.max(0, Math.min(qty, item.remaining_qty));

                return {
                    ...item,
                    qty: safeQty,
                };
            }),
        );
    };

    const handleRestockChange = (productId, checked) => {
        setItems((currentItems) =>
            currentItems.map((item) => {
                if (item.product_id !== productId) {
                    return item;
                }

                return {
                    ...item,
                    restock: checked,
                };
            }),
        );
    };

    const selectedItems = items.filter((item) => item.qty > 0);

    const grossTransactionTotal = (transaction.details || []).reduce(
        (total, detail) => total + Number(detail.subtotal || 0),
        0,
    );

    const calculateRefundTarget = (rawSubtotal) => {
        const discount = Number(transaction.discount || 0);

        if (discount <= 0 || grossTransactionTotal <= 0) {
            return rawSubtotal;
        }

        const discountShare = Math.round(
            discount * (rawSubtotal / grossTransactionTotal),
        );

        return Math.max(0, rawSubtotal - discountShare);
    };

    const rawSelectedTotal = selectedItems.reduce(
        (total, item) =>
            total + Number(item.qty || 0) * Number(item.price || 0),
        0,
    );

    const totalRefundPreview = calculateRefundTarget(rawSelectedTotal);

    let allocatedPreviewRefund = 0;

    const refundPreviewByProductId = selectedItems.reduce(
        (preview, item, index) => {
            const isLastItem = index === selectedItems.length - 1;
            const refundSubtotal = isLastItem
                ? Math.max(0, totalRefundPreview - allocatedPreviewRefund)
                : calculateRefundTarget(
                      Number(item.qty || 0) * Number(item.price || 0),
                  );

            preview[item.product_id] = refundSubtotal;
            allocatedPreviewRefund += refundSubtotal;
            return preview;
        },
        {},
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedItems.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Item belum dipilih",
                text: "Pilih minimal satu item dengan qty retur lebih dari 0.",
            });

            return;
        }

        Swal.fire({
            title: "Ajukan retur?",
            text: "Pengajuan retur akan dibuat dan menunggu persetujuan admin.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, ajukan retur",
            cancelButtonText: "Batal",
            confirmButtonColor: "#0d6efd",
            cancelButtonColor: "#6c757d",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post("/account/returns", {
                    transaction_id: transaction.id,
                    reason,
                    note,
                    items: items.map((item) => ({
                        product_id: item.product_id,
                        qty: item.qty,
                        restock: item.restock,
                    })),
                });
            }
        });
    };

    const reasonLabel = {
        defect: "Barang Rusak",
        wrong_item: "Salah Barang",
        customer_request: "Permintaan Customer",
        other: "Lainnya",
    };

    return (
        <>
            <Head title="Ajukan Retur" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-1 fw-bold">
                                        <i className="fa fa-undo me-2"></i>
                                        AJUKAN RETUR
                                    </h5>
                                    <small className="text-muted">
                                        Invoice: {transaction.invoice}
                                    </small>
                                </div>

                                <Link
                                    href={`/account/transactions/${transaction.invoice}`}
                                    className="btn btn-secondary shadow-sm rounded-sm"
                                >
                                    <i className="fa fa-arrow-left me-2"></i>
                                    Kembali
                                </Link>
                            </div>

                            <div className="card-body">
                                {errors.items && (
                                    <div className="alert alert-danger shadow-sm">
                                        {errors.items}
                                    </div>
                                )}

                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Invoice Transaksi
                                            </small>
                                            <h6 className="fw-bold mb-0">
                                                {transaction.invoice}
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Customer
                                            </small>
                                            <h6 className="fw-bold mb-0">
                                                {transaction.customer?.name ||
                                                    "Umum"}
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Total Transaksi
                                            </small>
                                            <h6 className="fw-bold text-success mb-0">
                                                {formatRupiah(
                                                    transaction.grand_total,
                                                )}
                                            </h6>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Alasan Retur
                                            </label>
                                            <select
                                                className="form-select border-0 shadow-sm"
                                                value={reason}
                                                onChange={(e) =>
                                                    setReason(e.target.value)
                                                }
                                            >
                                                <option value="defect">
                                                    {reasonLabel.defect}
                                                </option>
                                                <option value="wrong_item">
                                                    {reasonLabel.wrong_item}
                                                </option>
                                                <option value="customer_request">
                                                    {
                                                        reasonLabel.customer_request
                                                    }
                                                </option>
                                                <option value="other">
                                                    {reasonLabel.other}
                                                </option>
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Catatan
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control border-0 shadow-sm"
                                                placeholder="Contoh: kemasan rusak, ukuran salah, dll."
                                                value={note}
                                                onChange={(e) =>
                                                    setNote(e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="table table-bordered align-middle mb-0">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Produk</th>
                                                    <th className="text-center">
                                                        Dibeli
                                                    </th>
                                                    <th className="text-center">
                                                        Sudah Retur
                                                    </th>
                                                    <th className="text-center">
                                                        Bisa Diretur
                                                    </th>
                                                    <th className="text-center">
                                                        Qty Retur
                                                    </th>
                                                    <th className="text-center">
                                                        Restock
                                                    </th>
                                                    <th className="text-end">
                                                        Estimasi Refund
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {returnableItems.map((item) => {
                                                    const selectedItem =
                                                        items.find(
                                                            (row) =>
                                                                row.product_id ===
                                                                item.product_id,
                                                        );

                                                    const qty =
                                                        selectedItem?.qty || 0;

                                                    return (
                                                        <tr
                                                            key={
                                                                item.product_id
                                                            }
                                                        >
                                                            <td>
                                                                <div className="fw-bold">
                                                                    {
                                                                        item.product_title
                                                                    }
                                                                </div>
                                                                <small className="text-muted">
                                                                    Harga:{" "}
                                                                    {formatRupiah(
                                                                        item.price,
                                                                    )}
                                                                </small>
                                                            </td>

                                                            <td className="text-center">
                                                                {
                                                                    item.purchased_qty
                                                                }
                                                            </td>

                                                            <td className="text-center">
                                                                {
                                                                    item.returned_qty
                                                                }
                                                            </td>

                                                            <td className="text-center">
                                                                {
                                                                    item.remaining_qty
                                                                }
                                                            </td>

                                                            <td className="text-center">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={
                                                                        item.remaining_qty
                                                                    }
                                                                    className="form-control text-center border-0 shadow-sm"
                                                                    value={qty}
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleQtyChange(
                                                                            item.product_id,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={
                                                                        selectedItem?.restock ||
                                                                        false
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleRestockChange(
                                                                            item.product_id,
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="text-end fw-bold">
                                                                {formatRupiah(
                                                                    refundPreviewByProductId[
                                                                        item
                                                                            .product_id
                                                                    ] || 0,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                            <tfoot>
                                                <tr>
                                                    <th
                                                        colSpan="6"
                                                        className="text-end"
                                                    >
                                                        Estimasi Total Refund
                                                    </th>
                                                    <th className="text-end text-success">
                                                        {formatRupiah(
                                                            totalRefundPreview,
                                                        )}
                                                    </th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4">
                                        <Link
                                            href={`/account/transactions/${transaction.invoice}`}
                                            className="btn btn-secondary shadow-sm"
                                        >
                                            Batal
                                        </Link>

                                        <button
                                            type="submit"
                                            className="btn btn-primary shadow-sm"
                                        >
                                            <i className="fa fa-paper-plane me-2"></i>
                                            Ajukan Retur
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
