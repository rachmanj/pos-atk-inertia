import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";

const statusClasses = {
    open: "bg-success",
    closed: "bg-secondary",
};

const statusLabels = {
    open: "BUKA",
    closed: "TUTUP",
};

const dateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
};

export default function CashierShiftIndex() {
    const { activeShift, shifts, flash, auth } = usePage().props;
    const permissions = auth?.permissions || {};

    return (
        <>
            <Head>
                <title>Shift Kasir - ZenPOS</title>
            </Head>
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-clock me-2"></i> SHIFT
                                    KASIR
                                </h5>
                                <div>
                                    {!activeShift &&
                                        hasAnyPermission(
                                            ["cashier_shifts.open"],
                                            permissions,
                                        ) && (
                                            <Link
                                                href="/account/cashier-shifts/create"
                                                className="btn btn-success shadow-sm rounded-sm"
                                            >
                                                <i className="fas fa-sign-in-alt me-2"></i>{" "}
                                                BUKA SHIFT
                                            </Link>
                                        )}
                                    {activeShift && (
                                        <Link
                                            href={`/account/cashier-shifts/${activeShift.id}`}
                                            className="btn btn-primary shadow-sm rounded-sm"
                                        >
                                            <i className="fas fa-money-bill-wave me-2"></i>{" "}
                                            SHIFT AKTIF
                                        </Link>
                                    )}
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

                                {activeShift ? (
                                    <div className="card border-0 bg-light shadow-sm rounded-3 mb-4">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                                                <div>
                                                    <small className=" d-block mb-1">
                                                        Shift aktif
                                                    </small>
                                                    <div className="fw-bold fs-5">
                                                        Dibuka{" "}
                                                        {activeShift.opened_at
                                                            ? new Date(
                                                                  activeShift.opened_at,
                                                              ).toLocaleString(
                                                                  "id-ID",
                                                                  dateTimeFormatOptions,
                                                              )
                                                            : "-"}
                                                    </div>
                                                </div>
                                                <span className="badge bg-success shadow-sm px-3 py-2">
                                                    BUKA
                                                </span>
                                            </div>
                                            <div className="row g-3">
                                                <div className="col-md-3">
                                                    <div className="border rounded-3 bg-white p-3 h-100 text-dark">
                                                        <small className=" d-block mb-1">
                                                            Kas Awal
                                                        </small>
                                                        <div className="fw-bold">
                                                            {formatRupiah(
                                                                activeShift.cash_in_hand,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="border rounded-3 bg-white p-3 h-100 text-dark">
                                                        <small className=" d-block mb-1">
                                                            Penjualan Tunai
                                                        </small>
                                                        <div className="fw-bold text-success">
                                                            {formatRupiah(
                                                                activeShift
                                                                    .summary
                                                                    .cash_sales,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="border rounded-3 bg-white p-3 h-100 text-dark">
                                                        <small className=" d-block mb-1">
                                                            Refund Tunai
                                                        </small>
                                                        <div className="fw-bold text-danger">
                                                            {formatRupiah(
                                                                activeShift
                                                                    .summary
                                                                    .cash_refunds,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="border rounded-3 bg-white p-3 h-100 text-dark">
                                                        <small className=" d-block mb-1">
                                                            Kas Seharusnya
                                                        </small>
                                                        <div className="fw-bold text-primary">
                                                            {formatRupiah(
                                                                activeShift
                                                                    .summary
                                                                    .expected_cash,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="alert alert-warning shadow-sm mb-4">
                                        Belum ada shift aktif. Buka shift
                                        sebelum mulai transaksi kasir.
                                    </div>
                                )}

                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle mb-0">
                                        <thead className="table-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>
                                                    No.
                                                </th>
                                                <th>Kasir</th>
                                                <th>Waktu Buka</th>
                                                <th>Waktu Tutup</th>
                                                <th>Kas Awal</th>
                                                <th>Kas Seharusnya</th>
                                                <th>Kas Aktual</th>
                                                <th>Selisih</th>
                                                <th>Status</th>
                                                <th
                                                    className="text-center"
                                                    style={{ width: "12%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shifts.data.length > 0 ? (
                                                shifts.data.map(
                                                    (shift, index) => (
                                                        <tr key={shift.id}>
                                                            <td className="fw-bold text-center">
                                                                {index +
                                                                    1 +
                                                                    (shifts.current_page -
                                                                        1) *
                                                                        shifts.per_page}
                                                            </td>
                                                            <td>
                                                                {shift.user
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>
                                                            <td>
                                                                {shift.opened_at
                                                                    ? new Date(
                                                                          shift.opened_at,
                                                                      ).toLocaleString(
                                                                          "id-ID",
                                                                          dateTimeFormatOptions,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                            <td>
                                                                {shift.closed_at
                                                                    ? new Date(
                                                                          shift.closed_at,
                                                                      ).toLocaleString(
                                                                          "id-ID",
                                                                          dateTimeFormatOptions,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                            <td className="fw-bold">
                                                                {formatRupiah(
                                                                    shift.cash_in_hand,
                                                                )}
                                                            </td>
                                                            <td>
                                                                {formatRupiah(
                                                                    shift.status ===
                                                                        "open"
                                                                        ? shift
                                                                              .summary
                                                                              .expected_cash
                                                                        : shift.expected_cash,
                                                                )}
                                                            </td>
                                                            <td>
                                                                {shift.status ===
                                                                "closed"
                                                                    ? formatRupiah(
                                                                          shift.actual_cash,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                            <td
                                                                className={
                                                                    shift.difference <
                                                                    0
                                                                        ? "text-danger fw-bold"
                                                                        : "fw-bold"
                                                                }
                                                            >
                                                                {shift.status ===
                                                                "closed"
                                                                    ? formatRupiah(
                                                                          shift.difference,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={`badge shadow-sm ${statusClasses[shift.status] || "bg-secondary"}`}
                                                                >
                                                                    {statusLabels[
                                                                        shift
                                                                            .status
                                                                    ] ||
                                                                        shift.status.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <Link
                                                                    href={`/account/cashier-shifts/${shift.id}`}
                                                                    className="btn btn-secondary btn-sm shadow-sm"
                                                                >
                                                                    <i className="fas fa-eye me-1"></i>{" "}
                                                                    Detail
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="10"
                                                        className="text-center  py-4"
                                                    >
                                                        Belum ada histori shift
                                                        kasir.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={shifts.links}
                                        align="end"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
