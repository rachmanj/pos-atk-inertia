import React, { useState } from "react";
import LayoutAccount from "../../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "../../../../Shared/Pagination";
import hasAnyPermission from "../../../../Utils/Permissions";
import { formatRupiah } from "../../../../Utils/format";

const typeLabels = {
    opening_balance: "Saldo Awal",
    top_up: "Top Up",
    sale: "Penjualan",
    adjustment: "Penyesuaian",
};

export default function PpobBalanceLogIndex() {
    const { logs, accounts = [], filters = {}, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};
    const isAdmin = hasAnyPermission(["ppob-accounts.edit"], permissions);

    const [ppobAccountId, setPpobAccountId] = useState(filters.ppob_account_id || "");
    const [type, setType] = useState(filters.type || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");
    const [topUpAccountId, setTopUpAccountId] = useState(accounts[0]?.id ? String(accounts[0].id) : "");
    const [topUpAmount, setTopUpAmount] = useState("");
    const [topUpNote, setTopUpNote] = useState("");
    const [adjustDirection, setAdjustDirection] = useState("increase");

    const applyFilter = (e) => {
        e.preventDefault();
        router.get("/account/ppob-balance-logs", {
            ppob_account_id: ppobAccountId,
            type,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const submitTopUp = (e) => {
        e.preventDefault();
        router.post("/account/ppob-balance-logs", {
            ppob_account_id: topUpAccountId,
            type: "top_up",
            amount: topUpAmount,
            note: topUpNote,
        }, {
            onSuccess: () => {
                setTopUpAmount("");
                setTopUpNote("");
            },
        });
    };

    const submitAdjustment = (e) => {
        e.preventDefault();
        router.post("/account/ppob-balance-logs", {
            ppob_account_id: topUpAccountId,
            type: "adjustment",
            amount: topUpAmount,
            direction: adjustDirection,
            note: topUpNote,
        }, {
            onSuccess: () => {
                setTopUpAmount("");
                setTopUpNote("");
            },
        });
    };

    return (
        <>
            <Head title="Riwayat Saldo PPOB - ZenPOS" />
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 fw-bold"><i className="fa fa-list me-2"></i>RIWAYAT SALDO PPOB</h5>
                            </div>
                            <div className="card-body">
                                <form className="row g-2 mb-4" onSubmit={applyFilter}>
                                    <div className="col-md-3">
                                        <select className="form-select" value={ppobAccountId} onChange={(e) => setPpobAccountId(e.target.value)}>
                                            <option value="">Semua Akun</option>
                                            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                                            <option value="">Semua Tipe</option>
                                            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-2"><input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                                    <div className="col-md-2"><input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                                    <div className="col-md-2"><button className="btn btn-primary w-100">Filter</button></div>
                                </form>

                                {hasAnyPermission(["ppob-balance-logs.store"], permissions) && (
                                    <div className="row g-3 mb-4">
                                        <div className="col-lg-6">
                                            <div className="border rounded p-3">
                                                <h6 className="fw-bold">Top Up Saldo</h6>
                                                <form onSubmit={submitTopUp} className="row g-2">
                                                    <div className="col-12">
                                                        <select className="form-select" value={topUpAccountId} onChange={(e) => setTopUpAccountId(e.target.value)} required>
                                                            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-6"><input type="number" min="1" className="form-control" placeholder="Jumlah" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} required /></div>
                                                    <div className="col-6"><input type="text" className="form-control" placeholder="Catatan" value={topUpNote} onChange={(e) => setTopUpNote(e.target.value)} /></div>
                                                    <div className="col-12"><button className="btn btn-success btn-sm">Catat Top Up</button></div>
                                                </form>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <div className="col-lg-6">
                                                <div className="border rounded p-3">
                                                    <h6 className="fw-bold">Penyesuaian (Admin)</h6>
                                                    <form onSubmit={submitAdjustment} className="row g-2">
                                                        <div className="col-12">
                                                            <select className="form-select" value={topUpAccountId} onChange={(e) => setTopUpAccountId(e.target.value)} required>
                                                                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="col-4">
                                                            <select className="form-select" value={adjustDirection} onChange={(e) => setAdjustDirection(e.target.value)}>
                                                                <option value="increase">Tambah</option>
                                                                <option value="decrease">Kurang</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-8"><input type="number" min="1" className="form-control" placeholder="Jumlah" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} required /></div>
                                                        <div className="col-12"><input type="text" className="form-control" placeholder="Catatan" value={topUpNote} onChange={(e) => setTopUpNote(e.target.value)} /></div>
                                                        <div className="col-12"><button className="btn btn-warning btn-sm text-white">Catat Penyesuaian</button></div>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="table-responsive">
                                    <table className="table table-bordered">
                                        <thead className="bg-dark text-white">
                                            <tr>
                                                <th>Tanggal</th>
                                                <th>Akun</th>
                                                <th>Tipe</th>
                                                <th>Jumlah</th>
                                                <th>Saldo Sebelum</th>
                                                <th>Saldo Sesudah</th>
                                                <th>Kasir</th>
                                                <th>Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.data.length ? logs.data.map((log) => (
                                                <tr key={log.id}>
                                                    <td>{new Date(log.created_at).toLocaleString("id-ID")}</td>
                                                    <td>{log.ppob_account?.name}</td>
                                                    <td><span className="badge bg-secondary">{typeLabels[log.type] || log.type}</span></td>
                                                    <td className={log.amount < 0 ? "text-danger" : "text-success"}>{formatRupiah(log.amount)}</td>
                                                    <td>{formatRupiah(log.balance_before)}</td>
                                                    <td>{formatRupiah(log.balance_after)}</td>
                                                    <td>{log.user?.name}</td>
                                                    <td>{log.note || "-"}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="8" className="text-center">Belum ada riwayat saldo.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination links={logs.links} />
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
