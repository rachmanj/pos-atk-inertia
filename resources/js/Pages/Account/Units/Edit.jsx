import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";

export default function UnitEdit() {
    const { unit, errors = {} } = usePage().props;
    const [name, setName] = useState(unit.name || "");
    const [abbreviation, setAbbreviation] = useState(unit.abbreviation || "");

    const submit = (e) => {
        e.preventDefault();
        router.put(`/account/units/${unit.id}`, { name, abbreviation });
    };

    return (
        <>
            <Head title="Edit Satuan - ZenPOS" />
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-lg-6">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between">
                                <h5 className="mb-0 fw-bold">EDIT SATUAN</h5>
                                <Link href="/account/units" className="btn btn-secondary btn-sm">KEMBALI</Link>
                            </div>
                            <div className="card-body">
                                <form onSubmit={submit}>
                                    <div className="mb-3">
                                        <label className="fw-bold mb-2">Nama Satuan</label>
                                        <input type="text" className={`form-control ${errors.name ? "is-invalid" : ""}`} value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="fw-bold mb-2">Singkatan</label>
                                        <input type="text" className={`form-control ${errors.abbreviation ? "is-invalid" : ""}`} value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
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
