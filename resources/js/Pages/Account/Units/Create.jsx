import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";

export default function UnitCreate() {
    const { errors = {} } = usePage().props;
    const [name, setName] = useState("");
    const [abbreviation, setAbbreviation] = useState("");

    const submit = (e) => {
        e.preventDefault();
        router.post("/account/units", { name, abbreviation });
    };

    return (
        <>
            <Head title="Tambah Satuan - ZenPOS" />
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-lg-6">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between">
                                <h5 className="mb-0 fw-bold">TAMBAH SATUAN</h5>
                                <Link href="/account/units" className="btn btn-secondary btn-sm">KEMBALI</Link>
                            </div>
                            <div className="card-body">
                                <form onSubmit={submit}>
                                    <div className="mb-3">
                                        <label className="fw-bold mb-2">Nama Satuan</label>
                                        <input type="text" className={`form-control ${errors.name ? "is-invalid" : ""}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Pieces, Box, Lusin" />
                                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="fw-bold mb-2">Singkatan</label>
                                        <input type="text" className={`form-control ${errors.abbreviation ? "is-invalid" : ""}`} value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="pcs, box, lsn" />
                                        {errors.abbreviation && <div className="invalid-feedback">{errors.abbreviation}</div>}
                                    </div>
                                    <button type="submit" className="btn btn-success">SIMPAN</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
