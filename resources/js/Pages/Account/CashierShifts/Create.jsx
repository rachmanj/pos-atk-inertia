import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";

export default function CashierShiftCreate() {
    const { errors = {}, flash = {}, ppobAccount = null } = usePage().props;

    const [cashInHand, setCashInHand] = useState("");
    const [ppobOpeningBalance, setPpobOpeningBalance] = useState(
        ppobAccount?.current_balance != null ? String(ppobAccount.current_balance) : "",
    );
    const [note, setNote] = useState("");

    const openShift = (e) => {
        e.preventDefault();

        router.post("/account/cashier-shifts", {
            cash_in_hand: cashInHand,
            ppob_opening_balance: ppobOpeningBalance || null,
            note,
        });
    };

    return (
        <>
            <Head>
                <title>Buka Shift Kasir - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-lg-8 col-xl-6 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-door-open me-2"></i>
                                    BUKA SHIFT
                                </h5>

                                <Link
                                    href="/account/cashier-shifts"
                                    className="btn btn-secondary shadow-sm rounded-sm"
                                >
                                    <i className="fas fa-arrow-left me-2"></i>
                                    KEMBALI
                                </Link>
                            </div>

                            <div className="card-body">
                                {flash.error && (
                                    <div className="alert alert-danger shadow-sm">
                                        {flash.error}
                                    </div>
                                )}

                                <form onSubmit={openShift}>
                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Kas Awal
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            className={`form-control ${errors.cash_in_hand ? "is-invalid" : ""}`}
                                            value={cashInHand}
                                            onChange={(e) =>
                                                setCashInHand(e.target.value)
                                            }
                                            placeholder="0"
                                        />

                                        <small className="d-block mt-1">
                                            Masukkan saldo awal kas di laci
                                            sebelum shift dimulai.
                                        </small>

                                        {errors.cash_in_hand && (
                                            <div className="invalid-feedback">
                                                {errors.cash_in_hand}
                                            </div>
                                        )}
                                    </div>

                                    {ppobAccount && (
                                        <div className="mb-4">
                                            <label className="fw-bold mb-2">Saldo PPOB Awal ({ppobAccount.name})</label>
                                            <input type="number" min="0" className={`form-control ${errors.ppob_opening_balance ? "is-invalid" : ""}`} value={ppobOpeningBalance} onChange={(e) => setPpobOpeningBalance(e.target.value)} placeholder="Saldo di app PPOB saat buka shift" />
                                            <small className="d-block mt-1">
                                                Terisi otomatis dari saldo sistem (Rp {Number(ppobAccount.current_balance || 0).toLocaleString("id-ID")}). Sesuaikan jika berbeda dengan saldo di app PPOB provider.
                                            </small>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">Catatan Pembukaan</label>
                                        <textarea
                                            rows="4"
                                            className={`form-control ${errors.note ? "is-invalid" : ""}`}
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                            placeholder="Contoh: laci kas sudah dicek, saldo awal sesuai."
                                        />

                                        {errors.note && (
                                            <div className="invalid-feedback">
                                                {errors.note}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-success shadow-sm rounded-sm"
                                    >
                                        <i className="fas fa-play-circle me-2"></i>
                                        MULAI SHIFT
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
