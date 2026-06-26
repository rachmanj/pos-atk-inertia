import React from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";

export default function CustomerIndex() {
    const { customers, auth } = usePage().props;

    const permissions = auth?.permissions || {};

    return (
        <>
            <Head>
                <title>Customers - ZenPOS</title>
            </Head>
            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-md-12 col-lg-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-address-book me-2"></i>{" "}
                                    CUSTOMERS
                                </h5>
                                <div>
                                    {hasAnyPermission(
                                        ["customers.create"],
                                        permissions,
                                    ) && (
                                        <Link
                                            href="/account/customers/create"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fas fa-plus-circle me-2"></i>{" "}
                                            ADD CUSTOMER
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <Search URL={"/account/customers"} />
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-bordered table-centered table-nowrap mb-0 rounded">
                                        <thead className="thead-dark text-white bg-dark">
                                            <tr className="border-0">
                                                <th
                                                    className="border-0"
                                                    style={{ width: "5%" }}
                                                >
                                                    No.
                                                </th>
                                                <th className="border-0">
                                                    Full Name
                                                </th>
                                                <th className="border-0">
                                                    Phone Number
                                                </th>
                                                <th className="border-0">
                                                    Email
                                                </th>
                                                <th className="border-0">
                                                    Address
                                                </th>
                                                <th
                                                    className="border-0"
                                                    style={{ width: "15%" }}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.data.length > 0 ? (
                                                customers.data.map(
                                                    (customer, index) => (
                                                        <tr key={index}>
                                                            <td className="fw-bold text-center align-middle">
                                                                {++index +
                                                                    (customers.current_page -
                                                                        1) *
                                                                        customers.per_page}
                                                            </td>
                                                            <td className="align-middle fw-bold">
                                                                {customer.name}
                                                            </td>
                                                            <td className="align-middle">
                                                                {
                                                                    customer.no_telp
                                                                }
                                                            </td>
                                                            <td className="align-middle">
                                                                {customer.email ||
                                                                    "-"}
                                                            </td>
                                                            <td className="align-middle">
                                                                {
                                                                    customer.address
                                                                }
                                                            </td>
                                                            <td className="text-center align-middle">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "customers.edit",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/customers/${customer.id}/edit`}
                                                                        className="btn btn-primary btn-sm me-2 shadow-sm"
                                                                    >
                                                                        <i className="fas fa-pencil-alt"></i>
                                                                    </Link>
                                                                )}

                                                                {hasAnyPermission(
                                                                    [
                                                                        "customers.delete",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Delete
                                                                        URL={
                                                                            "/account/customers"
                                                                        }
                                                                        id={
                                                                            customer.id
                                                                        }
                                                                    />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="6"
                                                        className="text-center py-4"
                                                    >
                                                        Data Belum Tersedia!
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4">
                                    <Pagination
                                        links={customers.links}
                                        align="end"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
