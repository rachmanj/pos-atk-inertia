import { useRef, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function SettingIndex() {
    const { errors = {}, store = {}, ppob = {} } = usePage().props;

    const logoInputRef = useRef(null);

    const [name, setName] = useState(store.name || "");
    const [address, setAddress] = useState(store.address || "");
    const [phone, setPhone] = useState(store.phone || "");
    const [email, setEmail] = useState(store.email || "");
    const [receiptPaperSize, setReceiptPaperSize] = useState(
        store.receipt_paper_size || "58",
    );
    const [ppobAdminFee, setPpobAdminFee] = useState(String(ppob.ppob_admin_fee || 2000));
    const [ppobMinBalanceDefault, setPpobMinBalanceDefault] = useState(String(ppob.ppob_min_balance_default || 100000));
    const [logo, setLogo] = useState(null);
    const [removeLogo, setRemoveLogo] = useState(false);

    const updateSettings = (e) => {
        e.preventDefault();

        router.post(
            "/account/settings",
            {
                _method: "PUT",
                name,
                address,
                phone,
                email,
                receipt_paper_size: receiptPaperSize,
                ppob_admin_fee: ppobAdminFee,
                ppob_min_balance_default: ppobMinBalanceDefault,
                logo,
                remove_logo: removeLogo,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    setLogo(null);
                    setRemoveLogo(false);

                    if (logoInputRef.current) {
                        logoInputRef.current.value = "";
                    }

                    Swal.fire({
                        title: "Berhasil",
                        text: "Pengaturan toko berhasil diperbarui.",
                        icon: "success",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                },
            },
        );
    };

    const resetForm = () => {
        setName(store.name || "");
        setAddress(store.address || "");
        setPhone(store.phone || "");
        setEmail(store.email || "");
        setReceiptPaperSize(store.receipt_paper_size || "58");
        setPpobAdminFee(String(ppob.ppob_admin_fee || 2000));
        setPpobMinBalanceDefault(String(ppob.ppob_min_balance_default || 100000));
        setLogo(null);
        setRemoveLogo(false);

        if (logoInputRef.current) {
            logoInputRef.current.value = "";
        }
    };

    return (
        <>
            <Head title="Store Settings" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-1 fw-bold">
                                    <i className="fa fa-store me-2"></i>
                                    STORE SETTINGS
                                </h5>
                                <small className="text-muted">
                                    Pengaturan identitas toko untuk sidebar,
                                    login, dan struk transaksi.
                                </small>
                            </div>

                            <div className="card-body">
                                <form onSubmit={updateSettings}>
                                    <div className="row">
                                        <div className="col-lg-8">
                                            <div className="mb-4">
                                                <label className="fw-bold mb-2">
                                                    Nama Toko
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${
                                                        errors.name
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    value={name}
                                                    onChange={(e) =>
                                                        setName(e.target.value)
                                                    }
                                                    placeholder="Masukkan nama toko"
                                                />
                                                {errors.name && (
                                                    <div className="invalid-feedback">
                                                        {errors.name}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <label className="fw-bold mb-2">
                                                    Alamat
                                                </label>
                                                <textarea
                                                    className={`form-control ${
                                                        errors.address
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    rows="3"
                                                    value={address}
                                                    onChange={(e) =>
                                                        setAddress(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Alamat toko"
                                                ></textarea>
                                                {errors.address && (
                                                    <div className="invalid-feedback">
                                                        {errors.address}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="row">
                                                <div className="col-md-6 mb-4">
                                                    <label className="fw-bold mb-2">
                                                        Telepon
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${
                                                            errors.phone
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        value={phone}
                                                        onChange={(e) =>
                                                            setPhone(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Nomor telepon toko"
                                                    />
                                                    {errors.phone && (
                                                        <div className="invalid-feedback">
                                                            {errors.phone}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-md-6 mb-4">
                                                    <label className="fw-bold mb-2">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        className={`form-control ${
                                                            errors.email
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        value={email}
                                                        onChange={(e) =>
                                                            setEmail(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Email toko"
                                                    />
                                                    {errors.email && (
                                                        <div className="invalid-feedback">
                                                            {errors.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="fw-bold mb-2">
                                                    Ukuran Struk
                                                </label>
                                                <div
                                                    className="btn-group w-100"
                                                    role="group"
                                                    aria-label="Ukuran struk"
                                                >
                                                    {["58", "80"].map(
                                                        (size) => (
                                                            <button
                                                                key={size}
                                                                type="button"
                                                                className={`btn ${
                                                                    receiptPaperSize ===
                                                                    size
                                                                        ? "btn-success"
                                                                        : "btn-outline-secondary"
                                                                }`}
                                                                onClick={() =>
                                                                    setReceiptPaperSize(
                                                                        size,
                                                                    )
                                                                }
                                                            >
                                                                {size}mm
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                                {errors.receipt_paper_size ? (
                                                    <div className="text-danger small mt-2">
                                                        {
                                                            errors.receipt_paper_size
                                                        }
                                                    </div>
                                                ) : (
                                                    <div className="form-text">
                                                        Pilih 58mm untuk printer
                                                        thermal kecil atau 80mm
                                                        untuk printer kasir
                                                        lebar.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-lg-4">
                                            <div className="border rounded-3 p-3 h-100">
                                                <label className="fw-bold mb-3">
                                                    Logo Toko
                                                </label>

                                                <div className="mb-3">
                                                    {store.logo_url &&
                                                    !removeLogo ? (
                                                        <img
                                                            src={store.logo_url}
                                                            alt={name}
                                                            width="120"
                                                            height="120"
                                                            className="rounded-3 shadow-sm border object-fit-cover"
                                                        />
                                                    ) : (
                                                        <span
                                                            className="d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-muted border"
                                                            style={{
                                                                width: 120,
                                                                height: 120,
                                                            }}
                                                        >
                                                            <i className="fa fa-store fa-2x"></i>
                                                        </span>
                                                    )}
                                                </div>

                                                <input
                                                    ref={logoInputRef}
                                                    type="file"
                                                    className={`form-control ${
                                                        errors.logo
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    accept="image/jpeg,image/png,image/jpg"
                                                    onChange={(e) => {
                                                        setLogo(
                                                            e.target
                                                                .files?.[0] ??
                                                                null,
                                                        );
                                                        setRemoveLogo(false);
                                                    }}
                                                />
                                                {errors.logo ? (
                                                    <div className="invalid-feedback">
                                                        {errors.logo}
                                                    </div>
                                                ) : (
                                                    <div className="form-text">
                                                        Format JPG, JPEG, atau
                                                        PNG maksimal 2MB.
                                                    </div>
                                                )}

                                                {logo && (
                                                    <div className="small text-muted mt-2">
                                                        File baru: {logo.name}
                                                    </div>
                                                )}

                                                {store.logo_url && (
                                                    <div className="form-check mt-3">
                                                        <input
                                                            id="remove-logo"
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={removeLogo}
                                                            onChange={(e) => {
                                                                setRemoveLogo(
                                                                    e.target
                                                                        .checked,
                                                                );
                                                                setLogo(null);

                                                                if (
                                                                    logoInputRef.current
                                                                ) {
                                                                    logoInputRef.current.value =
                                                                        "";
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor="remove-logo"
                                                            className="form-check-label"
                                                        >
                                                            Hapus logo saat ini
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-4" />
                                    <h6 className="fw-bold mb-3">Pengaturan PPOB</h6>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold mb-2">Admin Fee Default (Rp)</label>
                                            <input type="number" min="0" className="form-control" value={ppobAdminFee} onChange={(e) => setPpobAdminFee(e.target.value)} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold mb-2">Alert Saldo Minimum Default (Rp)</label>
                                            <input type="number" min="0" className="form-control" value={ppobMinBalanceDefault} onChange={(e) => setPpobMinBalanceDefault(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            type="submit"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fa fa-save me-2"></i>
                                            SIMPAN
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-warning shadow-sm rounded-sm ms-2 text-white"
                                            onClick={resetForm}
                                        >
                                            <i className="fa fa-redo me-2"></i>
                                            RESET
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
