import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import {
    ArrowLeftOutlined,
    PlusCircleOutlined,
    ProfileOutlined,
} from "@ant-design/icons";

const differenceClass = (difference) => {
    if (difference > 0) {
        return "text-success";
    }

    if (difference < 0) {
        return "text-danger";
    }

    return "text-secondary";
};

export default function StockOpnameShow() {
    const { stockOpname, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};

    return (
        <>
            <Head>
                <title>{`${stockOpname.code} - ZenPOS`}</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <ProfileOutlined className="me-2" />
                                    DETAIL STOCK OPNAME
                                </h5>

                                <div className="d-flex gap-2">
                                    <Link
                                        href="/account/stock-opnames"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <ArrowLeftOutlined className="me-2" />
                                        KEMBALI
                                    </Link>

                                    {hasAnyPermission(
                                        ["stock_opnames.create"],
                                        permissions,
                                    ) && (
                                        <Link
                                            href="/account/stock-opnames/create"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <PlusCircleOutlined className="me-2" />
                                            OPNAME BARU
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="row g-4 mb-4">
                                    <div className="col-lg-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <div className="small text-muted mb-1">
                                                Kode Opname
                                            </div>

                                            <div className="fw-bold text-primary mb-3">
                                                {stockOpname.code}
                                            </div>

                                            <div className="small text-muted mb-1">
                                                Tanggal Opname
                                            </div>

                                            <div className="fw-bold">
                                                {new Date(
                                                    stockOpname.opname_date,
                                                ).toLocaleDateString("id-ID")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <div className="small text-muted mb-1">
                                                Pemeriksa
                                            </div>

                                            <div className="fw-bold mb-3">
                                                {stockOpname.user?.name || "-"}
                                            </div>

                                            <div className="small text-muted mb-1">
                                                Total Produk
                                            </div>

                                            <div className="fw-bold">
                                                {stockOpname.total_items}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="border rounded-3 p-3 h-100">
                                            <div className="small text-muted mb-1">
                                                Total Selisih
                                            </div>

                                            <div
                                                className={`fw-bold mb-3 ${differenceClass(
                                                    stockOpname.total_difference_qty,
                                                )}`}
                                            >
                                                {stockOpname.total_difference_qty >
                                                0
                                                    ? `+${stockOpname.total_difference_qty}`
                                                    : stockOpname.total_difference_qty}
                                            </div>

                                            <div className="small text-muted mb-1">
                                                Catatan
                                            </div>

                                            <div className="small">
                                                {stockOpname.note || "-"}
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
                                                    Stok Sistem
                                                </th>
                                                <th className="text-center">
                                                    Stok Fisik
                                                </th>
                                                <th className="text-center">
                                                    Selisih
                                                </th>
                                                <th>Catatan Item</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {stockOpname.details.map(
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
                                                            {
                                                                detail.system_stock
                                                            }
                                                        </td>

                                                        <td className="text-center fw-bold">
                                                            {
                                                                detail.physical_stock
                                                            }
                                                        </td>

                                                        <td
                                                            className={`text-center fw-bold ${differenceClass(
                                                                detail.difference_qty,
                                                            )}`}
                                                        >
                                                            {detail.difference_qty >
                                                            0
                                                                ? `+${detail.difference_qty}`
                                                                : detail.difference_qty}
                                                        </td>

                                                        <td>
                                                            {detail.note || "-"}
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
