import LayoutAccount from "../../../Layouts/Account";
import { formatRupiah } from "../../../Utils/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import hasAnyPermission from "../../../Utils/Permissions";
import { Modal, notification } from "antd";
import {
    ArrowLeftOutlined,
    CheckOutlined,
    CloseOutlined,
    UndoOutlined,
} from "@ant-design/icons";

export default function Show() {
    const { return: returnData, flash = {}, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};

    const details = returnData.details || [];

    const canApproveReturn =
        hasAnyPermission(["returns.approve"], permissions) &&
        returnData.status === "pending";

    const statusLabel = (status) => {
        if (status === "pending") {
            return "Menunggu";
        }

        if (status === "approved") {
            return "Disetujui";
        }

        if (status === "rejected") {
            return "Ditolak";
        }

        return "-";
    };

    const statusBadge = (status) => {
        if (status === "pending") {
            return "badge bg-warning text-dark shadow-sm";
        }

        if (status === "approved") {
            return "badge bg-success shadow-sm";
        }

        if (status === "rejected") {
            return "badge bg-danger shadow-sm";
        }

        return "badge bg-light text-dark border shadow-sm";
    };

    const reasonLabel = (reason) => {
        if (reason === "defect") {
            return "Barang Rusak";
        }

        if (reason === "wrong_item") {
            return "Salah Barang";
        }

        if (reason === "customer_request") {
            return "Permintaan Customer";
        }

        if (reason === "other") {
            return "Lainnya";
        }

        return "-";
    };

    const refundMethodLabel = (method) => {
        if (method === "cash") {
            return "Tunai";
        }

        if (method === "original") {
            return "Metode Awal";
        }

        return "-";
    };

    const paymentMethodLabel = (method) => {
        if (method === "cash") {
            return "Tunai";
        }

        if (method === "digital") {
            return "Digital";
        }

        return "-";
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const handleUpdateStatus = (status) => {
        const isApproved = status === "approved";

        Modal.confirm({
            title: isApproved ? "Setujui retur?" : "Tolak retur?",
            content: isApproved
                ? "Retur yang disetujui akan memproses stok dan penyesuaian profit."
                : "Retur ini akan ditandai sebagai ditolak.",
            okText: isApproved ? "Ya, setujui" : "Ya, tolak",
            cancelText: "Batal",
            okType: isApproved ? "primary" : "danger",
            onOk: () => {
                router.put(`/account/returns/${returnData.id}`, {
                    status,
                });
            },
        });
    };

    useEffect(() => {
        if (flash.success) {
            notification.success({
                message: "Berhasil",
                description: flash.success,
                duration: 2,
            });
        }

        if (flash.error) {
            notification.error({
                message: "Gagal",
                description: flash.error,
            });
        }
    }, [flash]);

    return (
        <>
            <Head title="Detail Retur" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-1 fw-bold">
                                        <UndoOutlined className="me-2" />
                                        DETAIL RETUR
                                    </h5>
                                    <small className="text-muted">
                                        Invoice Retur: {returnData.invoice}
                                    </small>
                                </div>

                                <div className="d-flex gap-2">
                                    <Link
                                        href="/account/returns"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <ArrowLeftOutlined className="me-2" />
                                        Kembali
                                    </Link>

                                    {canApproveReturn && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success shadow-sm"
                                                onClick={() =>
                                                    handleUpdateStatus(
                                                        "approved",
                                                    )
                                                }
                                            >
                                                <CheckOutlined className="me-2" />
                                                Setujui
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-danger shadow-sm"
                                                onClick={() =>
                                                    handleUpdateStatus(
                                                        "rejected",
                                                    )
                                                }
                                            >
                                                <CloseOutlined className="me-2" />
                                                Tolak
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="row mb-4">
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Invoice Retur
                                            </small>
                                            <h6 className="fw-bold mb-0">
                                                {returnData.invoice}
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Status Retur
                                            </small>
                                            <div className="mt-1">
                                                <span
                                                    className={statusBadge(
                                                        returnData.status,
                                                    )}
                                                >
                                                    {statusLabel(
                                                        returnData.status,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Total Refund
                                            </small>
                                            <h6 className="fw-bold text-success mb-0">
                                                {formatRupiah(
                                                    returnData.total_refund,
                                                )}
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 h-100">
                                            <small className="text-muted">
                                                Metode Refund
                                            </small>
                                            <h6 className="fw-bold mb-0">
                                                {refundMethodLabel(
                                                    returnData.refund_method,
                                                )}
                                            </h6>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-header bg-light fw-bold">
                                                Informasi Transaksi
                                            </div>

                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        Invoice Transaksi
                                                    </small>
                                                    <div className="fw-bold">
                                                        {
                                                            returnData
                                                                .transaction
                                                                ?.invoice
                                                        }
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        Customer
                                                    </small>
                                                    <div className="fw-bold">
                                                        {returnData.transaction
                                                            ?.customer?.name ||
                                                            "Umum"}
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        Kasir Transaksi
                                                    </small>
                                                    <div className="fw-bold">
                                                        {returnData.transaction
                                                            ?.cashier?.name ||
                                                            "-"}
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        Metode Pembayaran
                                                    </small>
                                                    <div className="fw-bold">
                                                        {paymentMethodLabel(
                                                            returnData
                                                                .transaction
                                                                ?.payment_method,
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <small className="text-muted">
                                                        Total Transaksi
                                                    </small>
                                                    <div className="fw-bold text-success">
                                                        {formatRupiah(
                                                            returnData
                                                                .transaction
                                                                ?.grand_total,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-header bg-light fw-bold">
                                                Informasi Retur
                                            </div>

                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        Tanggal Pengajuan
                                                    </small>
                                                    <div className="fw-bold">
                                                        {formatDate(
                                                            returnData.created_at,
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        Diajukan Oleh
                                                    </small>
                                                    <div className="fw-bold">
                                                        {returnData.cashier
                                                            ?.name || "-"}
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        Alasan Retur
                                                    </small>
                                                    <div className="fw-bold">
                                                        {reasonLabel(
                                                            returnData.reason,
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <small className="text-muted">
                                                        Catatan
                                                    </small>
                                                    <div className="fw-bold">
                                                        {returnData.note || "-"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>
                                                    No.
                                                </th>
                                                <th>Produk</th>
                                                <th className="text-center">
                                                    Qty Retur
                                                </th>
                                                <th className="text-end">
                                                    Harga
                                                </th>
                                                <th className="text-end">
                                                    Subtotal Refund
                                                </th>
                                                <th className="text-center">
                                                    Restock
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {details.length > 0 ? (
                                                details.map((detail, index) => (
                                                    <tr key={detail.id}>
                                                        <td className="text-center fw-bold">
                                                            {index + 1}
                                                        </td>

                                                        <td>
                                                            <div className="fw-bold">
                                                                {detail.product
                                                                    ?.title ||
                                                                    "-"}
                                                            </div>
                                                        </td>

                                                        <td className="text-center">
                                                            {detail.qty}
                                                        </td>

                                                        <td className="text-end">
                                                            {formatRupiah(
                                                                detail.price,
                                                            )}
                                                        </td>

                                                        <td className="text-end fw-bold text-success">
                                                            {formatRupiah(
                                                                detail.subtotal,
                                                            )}
                                                        </td>

                                                        <td className="text-center">
                                                            {detail.restock ? (
                                                                <span className="badge bg-success shadow-sm">
                                                                    Ya
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-secondary shadow-sm">
                                                                    Tidak
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="6"
                                                        className="text-center py-4"
                                                    >
                                                        Belum ada item retur.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>

                                        <tfoot>
                                            <tr>
                                                <th
                                                    colSpan="4"
                                                    className="text-end"
                                                >
                                                    Total Refund
                                                </th>
                                                <th className="text-end text-success">
                                                    {formatRupiah(
                                                        returnData.total_refund,
                                                    )}
                                                </th>
                                                <th></th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
