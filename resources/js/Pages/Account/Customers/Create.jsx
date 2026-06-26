import React, { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, router, Link } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function CustomerCreate() {
    const { errors = {} } = usePage().props;

    const [name, setName] = useState("");
    const [noTelp, setNoTelp] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    const storeCustomer = async (e) => {
        e.preventDefault();

        router.post(
            "/account/customers",
            {
                name: name,
                no_telp: noTelp,
                email: email,
                address: address,
            },
            {
                onSuccess: () => {
                    Swal.fire({
                        title: "Success!",
                        text: "Data Saved Successfully!",
                        icon: "success",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                },
            },
        );
    };

    return (
        <>
            <Head>
                <title>Create Customer - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-md-12 col-lg-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-user-plus me-2"></i>
                                    ADD CUSTOMER
                                </h5>

                                <div>
                                    <Link
                                        href="/account/customers"
                                        className="btn btn-secondary shadow-sm rounded-sm"
                                    >
                                        <i className="fa fa-arrow-left me-2"></i>
                                        BACK
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body">
                                <form onSubmit={storeCustomer}>
                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Full Name
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
                                                placeholder="Enter Customer Name"
                                            />
                                            {errors.name && (
                                                <div className="invalid-feedback">
                                                    {errors.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${
                                                    errors.no_telp
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={noTelp}
                                                onChange={(e) =>
                                                    setNoTelp(e.target.value)
                                                }
                                                placeholder="Enter Phone Number (08...)"
                                            />
                                            {errors.no_telp && (
                                                <div className="invalid-feedback">
                                                    {errors.no_telp}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Email Address (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-control ${
                                                errors.email ? "is-invalid" : ""
                                            }`}
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            placeholder="Enter Email Address"
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            className={`form-control ${
                                                errors.address
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={address}
                                            onChange={(e) =>
                                                setAddress(e.target.value)
                                            }
                                            rows="3"
                                            placeholder="Enter Complete Address"
                                        ></textarea>
                                        {errors.address && (
                                            <div className="invalid-feedback">
                                                {errors.address}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fa fa-save me-2"></i>
                                            SAVE
                                        </button>

                                        <button
                                            type="reset"
                                            className="btn btn-warning shadow-sm rounded-sm ms-2 text-white"
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
