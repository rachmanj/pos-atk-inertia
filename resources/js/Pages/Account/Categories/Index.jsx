import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";

export default function CategoryIndex() {
    const { categories, auth = {} } = usePage().props;

    const permissions = auth.permissions || {};

    return (
        <>
            <Head>
                <title>Kategori - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 col-md-12 col-lg-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-folder me-2"></i>
                                    KATEGORI
                                </h5>

                                <div>
                                    {hasAnyPermission(
                                        ["categories.create"],
                                        permissions,
                                    ) && (
                                        <Link
                                            href="/account/categories/create"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fas fa-plus-circle me-2"></i>
                                            TAMBAH KATEGORI
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="mb-3">
                                    <Search URL="/account/categories" />
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
                                                <th
                                                    className="border-0"
                                                    style={{ width: "20%" }}
                                                >
                                                    Gambar
                                                </th>
                                                <th className="border-0">
                                                    Nama Kategori
                                                </th>
                                                <th
                                                    className="border-0"
                                                    style={{ width: "15%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {categories.data.length > 0 ? (
                                                categories.data.map(
                                                    (category, index) => (
                                                        <tr key={category.id}>
                                                            <td className="fw-bold text-center align-middle">
                                                                {index +
                                                                    1 +
                                                                    (categories.current_page -
                                                                        1) *
                                                                        categories.per_page}
                                                            </td>

                                                            <td className="text-center">
                                                                {category.image ? (
                                                                    <img
                                                                        src={
                                                                            category.image
                                                                        }
                                                                        width="50"
                                                                        height="50"
                                                                        className="rounded-3 shadow-sm object-fit-cover"
                                                                        alt={
                                                                            category.name
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-white shadow-sm"
                                                                        style={{
                                                                            width: 50,
                                                                            height: 50,
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-image"></i>
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="align-middle">
                                                                {category.name}
                                                            </td>

                                                            <td className="text-center align-middle">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "categories.edit",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/categories/${category.id}/edit`}
                                                                        className="btn btn-primary btn-sm me-2 shadow-sm"
                                                                    >
                                                                        <i className="fas fa-pencil-alt"></i>
                                                                    </Link>
                                                                )}

                                                                {hasAnyPermission(
                                                                    [
                                                                        "categories.delete",
                                                                    ],
                                                                    permissions,
                                                                ) && (
                                                                    <Delete
                                                                        URL="/account/categories"
                                                                        id={
                                                                            category.id
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
                                                        colSpan="4"
                                                        className="text-center py-4"
                                                    >
                                                        Data belum tersedia!
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <Pagination
                                        links={categories.links}
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
