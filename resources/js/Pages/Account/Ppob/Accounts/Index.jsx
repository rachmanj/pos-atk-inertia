import LayoutAccount from "../../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import hasAnyPermission from "../../../../Utils/Permissions";
import { formatRupiah } from "../../../../Utils/format";

export default function PpobAccountIndex() {
    const { accounts = [], auth = {} } = usePage().props;
    const permissions = auth.permissions || {};

    return (
        <>
            <Head title="Akun PPOB - ZenPOS" />
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between">
                                <h5 className="mb-0 fw-bold"><i className="fa fa-wallet me-2"></i>AKUN PPOB</h5>
                                {hasAnyPermission(["ppob-accounts.create"], permissions) && (
                                    <Link href="/account/ppob-accounts/create" className="btn btn-success btn-sm">TAMBAH AKUN</Link>
                                )}
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered">
                                        <thead className="bg-dark text-white">
                                            <tr>
                                                <th>Nama</th>
                                                <th>Saldo</th>
                                                <th>Alert Minimum</th>
                                                <th>Status</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accounts.length ? accounts.map((account) => (
                                                <tr key={account.id}>
                                                    <td>{account.name}</td>
                                                    <td className={account.current_balance <= account.min_balance_alert ? "text-danger fw-bold" : ""}>
                                                        {formatRupiah(account.current_balance)}
                                                    </td>
                                                    <td>{formatRupiah(account.min_balance_alert)}</td>
                                                    <td>
                                                        <span className={`badge ${account.is_active ? "bg-success" : "bg-secondary"}`}>
                                                            {account.is_active ? "Aktif" : "Nonaktif"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {hasAnyPermission(["ppob-accounts.edit"], permissions) && (
                                                            <Link href={`/account/ppob-accounts/${account.id}/edit`} className="btn btn-warning btn-sm text-white">Edit</Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" className="text-center">Belum ada akun PPOB.</td></tr>
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
