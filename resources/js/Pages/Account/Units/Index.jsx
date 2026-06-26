import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, usePage } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";

export default function UnitIndex() {
    const { units, auth = {} } = usePage().props;
    const permissions = auth.permissions || {};

    return (
        <>
            <Head title="Satuan - ZenPOS" />
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-balance-scale me-2"></i>
                                    SATUAN
                                </h5>
                                {hasAnyPermission(["units.create"], permissions) && (
                                    <Link href="/account/units/create" className="btn btn-success shadow-sm rounded-sm">
                                        <i className="fa fa-plus-circle me-2"></i>
                                        TAMBAH SATUAN
                                    </Link>
                                )}
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <Search URL="/account/units" />
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-bordered table-centered mb-0 rounded">
                                        <thead className="thead-dark text-white bg-dark">
                                            <tr>
                                                <th style={{ width: "5%" }}>No.</th>
                                                <th>Nama</th>
                                                <th>Singkatan</th>
                                                <th style={{ width: "15%" }}>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {units.data.length > 0 ? (
                                                units.data.map((unit, index) => (
                                                    <tr key={unit.id}>
                                                        <td>{units.from + index}</td>
                                                        <td>{unit.name}</td>
                                                        <td>{unit.abbreviation}</td>
                                                        <td>
                                                            {hasAnyPermission(["units.edit"], permissions) && (
                                                                <Link href={`/account/units/${unit.id}/edit`} className="btn btn-warning btn-sm text-white me-1">
                                                                    <i className="fa fa-edit"></i>
                                                                </Link>
                                                            )}
                                                            {hasAnyPermission(["units.delete"], permissions) && (
                                                                <Delete URL={`/account/units/${unit.id}`} />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center">Belum ada data satuan.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination links={units.links} />
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
