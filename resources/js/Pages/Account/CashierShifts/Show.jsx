import React, { useMemo, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import {
    ArrowLeftOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";

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

export default function CashierShiftShow() {
    const { shift, flash, errors, auth } = usePage().props;
    const permissions = auth?.permissions || {};

    const [actualCash, setActualCash] = useState(
        shift.status === "open"
            ? shift.summary.expected_cash
            : shift.actual_cash,
    );
    const [note, setNote] = useState("");

    const estimatedDifference = useMemo(() => {
        const value =
            Number(actualCash || 0) - Number(shift.summary.expected_cash || 0);

        return Number.isNaN(value) ? 0 : value;
    }, [actualCash, shift.summary.expected_cash]);

    const closeShift = (e) => {
        e.preventDefault();

        router.put(`/account/cashier-shifts/${shift.id}/close`, {
            actual_cash: actualCash,
            note,
        });
    };

    return (
        <>
            <Head>
                <title>Detail Shift Kasir - ZenPOS</title>
            </Head>
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <ClockCircleOutlined className="me-2" />{" "}
                                    DETAIL SHIFT
                                </h5>
                                <Link
                                    href="/account/cashier-shifts"
                                    className="btn btn-secondary shadow-sm rounded-sm"
                                >
                                    <ArrowLeftOutlined className="me-2" />{" "}
                                    KEMBALI
                                </Link>
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

                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-light h-100">
                                            <small className=" d-block mb-1">
                                                Kasir
                                            </small>
                                            <div className="fw-bold">
                                                {shift.user?.name || "-"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-light h-100">
                                            <small className=" d-block mb-1">
                                                Waktu Buka
                                            </small>
                                            <div className="fw-bold">
                                                {shift.opened_at
                                                    ? new Date(
                                                          shift.opened_at,
                                                      ).toLocaleString(
                                                          "id-ID",
                                                          dateTimeFormatOptions,
                                                      )
                                                    : "-"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-light h-100">
                                            <small className=" d-block mb-1">
                                                Waktu Tutup
                                            </small>
                                            <div className="fw-bold">
                                                {shift.closed_at
                                                    ? new Date(
                                                          shift.closed_at,
                                                      ).toLocaleString(
                                                          "id-ID",
                                                          dateTimeFormatOptions,
                                                      )
                                                    : "-"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-light h-100">
                                            <small className=" d-block mb-1">
                                                Status
                                            </small>
                                            <div
                                                className={`badge shadow-sm ${shift.status === "open" ? "bg-success" : "bg-secondary"}`}
                                            >
                                                {statusLabels[shift.status] ||
                                                    shift.status.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-white h-100">
                                            <small className=" d-block mb-1">
                                                Kas Awal
                                            </small>
                                            <div className="fw-bold">
                                                {formatRupiah(
                                                    shift.cash_in_hand,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-white h-100">
                                            <small className=" d-block mb-1">
                                                Penjualan Tunai
                                            </small>
                                            <div className="fw-bold text-success">
                                                {formatRupiah(
                                                    shift.summary.cash_sales,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-white h-100">
                                            <small className=" d-block mb-1">
                                                Penjualan Non Tunai
                                            </small>
                                            <div className="fw-bold text-primary">
                                                {formatRupiah(
                                                    shift.summary
                                                        .non_cash_sales,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-white h-100">
                                            <small className=" d-block mb-1">
                                                Kas Seharusnya
                                            </small>
                                            <div className="fw-bold">
                                                {formatRupiah(
                                                    shift.expected_cash,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-white h-100">
                                            <small className=" d-block mb-1">
                                                Refund Tunai
                                            </small>
                                            <div className="fw-bold text-danger">
                                                {formatRupiah(
                                                    shift.summary.cash_refunds,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-white h-100">
                                            <small className=" d-block mb-1">
                                                Refund Non Tunai
                                            </small>
                                            <div className="fw-bold text-danger">
                                                {formatRupiah(
                                                    shift.summary
                                                        .non_cash_refunds,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-white h-100">
                                            <small className=" d-block mb-1">
                                                Transaksi
                                            </small>
                                            <div className="fw-bold">
                                                {
                                                    shift.summary
                                                        .total_transactions
                                                }
                                            </div>
                                            <small className="">
                                                Lunas:{" "}
                                                {
                                                    shift.summary
                                                        .paid_transactions
                                                }
                                            </small>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded-3 p-3 bg-white h-100">
                                            <small className=" d-block mb-1">
                                                Retur Disetujui
                                            </small>
                                            <div className="fw-bold">
                                                {shift.summary.total_returns}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {shift.summary?.ppob_expected_balance != null && (
                                    <div className="border rounded-3 p-3 bg-light mb-4 text-white">
                                        <h6 className="fw-bold mb-3">Ringkasan PPOB Shift</h6>
                                        <div className="row g-3">
                                            <div className="col-md-3"><small className="text-white d-block">Saldo Awal</small><strong>{formatRupiah(shift.summary.ppob_opening_balance || shift.ppob_opening_balance || 0)}</strong></div>
                                            <div className="col-md-3"><small className="text-white d-block">Top Up</small><strong>{formatRupiah(shift.summary.ppob_top_ups || 0)}</strong></div>
                                            <div className="col-md-3"><small className="text-white d-block">Biaya Penjualan</small><strong>{formatRupiah(shift.summary.ppob_sales_cost || 0)}</strong></div>
                                            <div className="col-md-3"><small className="text-white d-block">Kontribusi Shift Ini</small><strong>{formatRupiah(shift.summary.ppob_expected_balance || 0)}</strong></div>
                                        </div>
                                        <small className="text-white d-block mt-3">
                                            Akun PPOB ini dapat dipakai bersamaan oleh kasir lain, sehingga saldo di atas hanya mencerminkan kontribusi shift ini, bukan saldo fisik akun.
                                            Verifikasi saldo fisik di app provider dilakukan di menu{" "}
                                            <Link href="/account/ppob-balance-logs" className="link-light">Riwayat Saldo PPOB</Link>, bukan per shift.
                                        </small>
                                    </div>
                                )}

                                {shift.note && (
                                    <div className="border rounded-3 p-3 bg-light mb-4">
                                        <small className=" d-block mb-1">
                                            Catatan Shift
                                        </small>
                                        <div style={{ whiteSpace: "pre-line" }}>
                                            {shift.note}
                                        </div>
                                    </div>
                                )}

                                {shift.status === "open" &&
                                hasAnyPermission(
                                    ["cashier_shifts.close"],
                                    permissions,
                                ) ? (
                                    <div className="card border-0 bg-light shadow-sm rounded-3">
                                        <div className="card-body">
                                            <h6 className="fw-bold mb-3">
                                                <CloseCircleOutlined className="me-2" />{" "}
                                                TUTUP SHIFT
                                            </h6>
                                            <form onSubmit={closeShift}>
                                                <div className="row g-3">
                                                    <div className="col-md-4">
                                                        <label className="fw-bold mb-2">
                                                            Kas Aktual
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className={`form-control ${errors.actual_cash ? "is-invalid" : ""}`}
                                                            value={actualCash}
                                                            onChange={(e) =>
                                                                setActualCash(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        {errors.actual_cash && (
                                                            <div className="invalid-feedback">
                                                                {
                                                                    errors.actual_cash
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="fw-bold mb-2">
                                                            Kas Seharusnya
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={formatRupiah(
                                                                shift.summary
                                                                    .expected_cash,
                                                            )}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="fw-bold mb-2">
                                                            Perkiraan Selisih
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${estimatedDifference < 0 ? "text-danger" : "text-success"}`}
                                                            value={formatRupiah(
                                                                estimatedDifference,
                                                            )}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="fw-bold mb-2">
                                                            Catatan Penutupan
                                                        </label>
                                                        <textarea
                                                            rows="4"
                                                            className={`form-control ${errors.note ? "is-invalid" : ""}`}
                                                            value={note}
                                                            onChange={(e) =>
                                                                setNote(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Contoh: ada selisih kas karena pembulatan atau koreksi manual."
                                                        />
                                                        {errors.note && (
                                                            <div className="invalid-feedback">
                                                                {errors.note}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="btn btn-danger shadow-sm rounded-sm mt-3"
                                                >
                                                    <CloseCircleOutlined className="me-2" />{" "}
                                                    TUTUP SHIFT
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                ) : shift.status === "closed" ? (
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <div className="border rounded-3 p-3 bg-light h-100">
                                                <small className=" d-block mb-1">
                                                    Kas Aktual
                                                </small>
                                                <div className="fw-bold">
                                                    {formatRupiah(
                                                        shift.actual_cash,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="border rounded-3 p-3 bg-light h-100">
                                                <small className=" d-block mb-1">
                                                    Selisih
                                                </small>
                                                <div
                                                    className={`fw-bold ${shift.difference < 0 ? "text-danger" : "text-white"}`}
                                                >
                                                    {formatRupiah(
                                                        shift.difference,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="border rounded-3 p-3 bg-light h-100">
                                                <small className=" d-block mb-1">
                                                    Total Transaksi
                                                </small>
                                                <div className="fw-bold">
                                                    {shift.total_transactions}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
