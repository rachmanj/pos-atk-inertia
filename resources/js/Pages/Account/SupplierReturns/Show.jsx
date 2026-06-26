import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import { formatRupiah } from "../../../Utils/format";

const reasonLabels = {
    defect: "Barang Rusak",
    expired: "Kedaluwarsa",
    wrong_item: "Barang Tidak Sesuai",
    other: "Lainnya",
};

export default function SupplierReturnShow() {
    const { supplierReturn, flash } = usePage().props;

    return (
        <>
            <Head>
                <title>{`Retur Supplier ${supplierReturn.invoice} - ZenPOS`}</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-file-export me-2"></i>
                                    DETAIL RETUR SUPPLIER
                                </h5>

                                <div className="d-flex gap-2">
                                    <Link
                                        href="/account/supplier-returns"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-arrow-left me-2"></i>
                                        KEMBALI
                                    </Link>

                                    <Link
                                        href={`/account/purchases/${supplierReturn.purchase?.invoice}`}
                                        className="btn btn-primary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-shopping-bag me-2"></i>
                                        PEMBELIAN ASAL
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body">
                                {flash.success && (
                                    <div className="alert alert-success shadow-sm">
                                        {flash.success}
                                    </div>
                                )}

                                {flash.error && (
                                    <div className="alert alert-danger shadow-sm">
                                        {flash.error}
                                    </div>
                                )}

                                <div className="row g-4 mb-4">
                                    <div className="col-lg-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <div className="small text-muted mb-1">
                                                Invoice Retur
                                            </div>

                                            <div className="fw-bold text-danger mb-3">
                                                {supplierReturn.invoice}
                                            </div>

                                            <div className="small text-muted mb-1">
                                                Tanggal Retur
                                            </div>

                                            <div className="fw-bold">
                                                {new Date(
                                                    supplierReturn.return_date,
                                                ).toLocaleDateString("id-ID")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <div className="small text-muted mb-1">
                                                Supplier
                                            </div>

                                            <div className="fw-bold mb-2">
                                                {supplierReturn.supplier
                                                    ?.name || "-"}
                                            </div>

                                            <div className="small text-muted">
                                                {supplierReturn.supplier
                                                    ?.no_telp || "-"}
                                            </div>

                                            <div className="small text-muted">
                                                {supplierReturn.supplier
                                                    ?.email || "-"}
                                            </div>

                                            <div className="small text-muted mt-2">
                                                {supplierReturn.supplier
                                                    ?.address || "-"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <div className="small text-muted mb-1">
                                                Ringkasan
                                            </div>

                                            <div className="fw-bold mb-2">
                                                Invoice Pembelian:{" "}
                                                {supplierReturn.purchase
                                                    ?.invoice || "-"}
                                            </div>

                                            <div className="fw-bold mb-2">
                                                Total Qty:{" "}
                                                {supplierReturn.total_qty}
                                            </div>

                                            <div className="fw-bold text-danger">
                                                {formatRupiah(
                                                    supplierReturn.total_amount,
                                                )}
                                            </div>

                                            <div className="small text-muted mt-2">
                                                Dibuat oleh:{" "}
                                                {supplierReturn.user?.name ||
                                                    "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-lg-6">
                                        <div className="alert alert-light border shadow-sm mb-0">
                                            <div className="fw-bold mb-1">
                                                Alasan Retur
                                            </div>

                                            <div>
                                                {reasonLabels[
                                                    supplierReturn.reason
                                                ] || supplierReturn.reason}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-6">
                                        <div className="alert alert-light border shadow-sm mb-0">
                                            <div className="fw-bold mb-1">
                                                Catatan
                                            </div>

                                            <div>
                                                {supplierReturn.note || "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Produk</th>
                                                <th>Barcode</th>
                                                <th className="text-center">
                                                    Qty
                                                </th>
                                                <th className="text-end">
                                                    Harga Beli
                                                </th>
                                                <th className="text-end">
                                                    Subtotal
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {supplierReturn.details.map(
                                                (detail) => (
                                                    <tr key={detail.id}>
                                                        <td className="fw-bold">
                                                            {detail.product
                                                                ?.title || "-"}

                                                            <div className="small text-muted">
                                                                {detail.product
                                                                    ?.unit ||
                                                                    "-"}
                                                            </div>
                                                        </td>

                                                        <td>
                                                            {detail.product
                                                                ?.barcode ||
                                                                "-"}
                                                        </td>

                                                        <td className="text-center fw-bold">
                                                            {detail.qty}
                                                        </td>

                                                        <td className="text-end">
                                                            {formatRupiah(
                                                                detail.buy_price,
                                                            )}
                                                        </td>

                                                        <td className="text-end fw-bold text-danger">
                                                            {formatRupiah(
                                                                detail.subtotal,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
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
