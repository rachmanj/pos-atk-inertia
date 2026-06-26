import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";

export default function PurchaseShow() {
    const { purchase, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};

    return (
        <>
            <Head>
                <title>{`Pembelian ${purchase.invoice} - ZenPOS`}</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-file-invoice me-2"></i>
                                    DETAIL PEMBELIAN
                                </h5>

                                <div className="d-flex gap-2">
                                    <Link
                                        href="/account/purchases"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-arrow-left me-2"></i>
                                        KEMBALI
                                    </Link>

                                    {hasAnyPermission(
                                        ["purchases.create"],
                                        permissions,
                                    ) && (
                                        <Link
                                            href="/account/purchases/create"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fa fa-plus-circle me-2"></i>
                                            PEMBELIAN BARU
                                        </Link>
                                    )}

                                    {hasAnyPermission(
                                        ["supplier_returns.create"],
                                        permissions,
                                    ) && (
                                        <Link
                                            href={`/account/supplier-returns/create/${purchase.invoice}`}
                                            className="btn btn-danger shadow-sm rounded-sm"
                                        >
                                            <i className="fa fa-undo me-2"></i>
                                            RETUR SUPPLIER
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="row g-4 mb-4">
                                    <div className="col-lg-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <div className="small text-muted mb-1">
                                                Invoice
                                            </div>

                                            <div className="fw-bold text-primary mb-3">
                                                {purchase.invoice}
                                            </div>

                                            <div className="small text-muted mb-1">
                                                Tanggal Pembelian
                                            </div>

                                            <div className="fw-bold">
                                                {new Date(
                                                    purchase.purchase_date,
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
                                                {purchase.supplier?.name || "-"}
                                            </div>

                                            <div className="small text-muted">
                                                {purchase.supplier?.no_telp ||
                                                    "-"}
                                            </div>

                                            <div className="small text-muted">
                                                {purchase.supplier?.email ||
                                                    "-"}
                                            </div>

                                            <div className="small text-muted mt-2">
                                                {purchase.supplier?.address ||
                                                    "-"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <div className="small text-muted mb-1">
                                                Ringkasan
                                            </div>

                                            <div className="fw-bold mb-2">
                                                Total Item:{" "}
                                                {purchase.total_items}
                                            </div>

                                            <div className="fw-bold mb-2">
                                                Total Qty: {purchase.total_qty}
                                            </div>

                                            <div className="fw-bold text-success">
                                                {formatRupiah(
                                                    purchase.total_amount,
                                                )}
                                            </div>

                                            <div className="small text-muted mt-2">
                                                Dibuat oleh:{" "}
                                                {purchase.user?.name || "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {purchase.note && (
                                    <div className="alert alert-light border shadow-sm">
                                        <div className="fw-bold mb-1">
                                            Catatan
                                        </div>

                                        <div>{purchase.note}</div>
                                    </div>
                                )}

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
                                            {purchase.details.map((detail) => (
                                                <tr key={detail.id}>
                                                    <td className="fw-bold">
                                                        {detail.product
                                                            ?.title || "-"}

                                                        <div className="small text-muted">
                                                            {detail.product
                                                                ?.unit || "-"}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {detail.product
                                                            ?.barcode || "-"}
                                                    </td>

                                                    <td className="text-center fw-bold">
                                                        {detail.qty}
                                                    </td>

                                                    <td className="text-end">
                                                        {formatRupiah(
                                                            detail.buy_price,
                                                        )}
                                                    </td>

                                                    <td className="text-end fw-bold text-success">
                                                        {formatRupiah(
                                                            detail.subtotal,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
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
