import React, { useState } from "react";
import LayoutAccount from "../../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { formatRupiah } from "../../../../Utils/format";

export default function PpobAccountEdit() {
    const { account } = usePage().props;
    const [name, setName] = useState(account.name || "");
    const [minBalanceAlert, setMinBalanceAlert] = useState(String(account.min_balance_alert || 0));
    const [isActive, setIsActive] = useState(!!account.is_active);
    const [note, setNote] = useState(account.note || "");

    const submit = (e) => {
        e.preventDefault();
        router.put(`/account/ppob-accounts/${account.id}`, {
            name,
            min_balance_alert: minBalanceAlert,
            is_active: isActive,
            note,
        });
    };

    return (
        <>
            <Head title="Edit Akun PPOB - ZenPOS" />
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between">
                                <h5 className="mb-0 fw-bold">EDIT AKUN PPOB</h5>
                                <Link href="/account/ppob-accounts" className="btn btn-secondary btn-sm">KEMBALI</Link>
                            </div>
                            <div className="card-body">
                                <p className="text-muted">Saldo saat ini: <strong>{formatRupiah(account.current_balance)}</strong></p>
                                <form onSubmit={submit}>
                                    <div className="mb-3">
                                        <label className="fw-bold">Nama Provider</label>
                                        <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="fw-bold">Alert Saldo Minimum</label>
                                        <input type="number" min="0" className="form-control" value={minBalanceAlert} onChange={(e) => setMinBalanceAlert(e.target.value)} />
                                    </div>
                                    <div className="mb-3 form-check">
                                        <input type="checkbox" className="form-check-input" id="is_active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                        <label className="form-check-label" htmlFor="is_active">Aktif</label>
                                    </div>
                                    <div className="mb-3">
                                        <label className="fw-bold">Catatan</label>
                                        <textarea className="form-control" rows="3" value={note} onChange={(e) => setNote(e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn btn-success">UPDATE</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
