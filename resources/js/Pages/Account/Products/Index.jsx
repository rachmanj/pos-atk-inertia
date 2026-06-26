import React, { useEffect, useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage, Link, router } from "@inertiajs/react";
import Pagination from "../../../Shared/Pagination";
import Search from "../../../Shared/Search";
import Delete from "../../../Shared/Delete";
import hasAnyPermission from "../../../Utils/Permissions";
import { formatRupiah } from "../../../Utils/format";
import Swal from "sweetalert2";
import { Modal, Button } from "react-bootstrap";

export default function ProductIndex() {
    const { products, auth = {}, flash = {} } = usePage().props;

    const allPermissions = auth.permissions || {};

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importProcessing, setImportProcessing] = useState(false);

    useEffect(() => {
        if (flash.success) {
            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: flash.success,
            });
        }

        if (flash.error) {
            Swal.fire({
                icon: "error",
                title: "Import Gagal",
                text: flash.error,
            });
        }
    }, [flash.success, flash.error]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(products.data.map((product) => product.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelect = (id) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(
                selectedProducts.filter((productId) => productId !== id),
            );
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const handlePrintSelected = () => {
        if (selectedProducts.length === 0) {
            Swal.fire({
                title: "Peringatan!",
                text: "Pilih minimal 1 produk untuk dicetak barcodenya!",
                icon: "warning",
            });

            return;
        }

        const queryParams = selectedProducts
            .map((id) => `product_ids[]=${id}`)
            .join("&");

        const url = `/account/products/print-barcodes?${queryParams}`;

        window.open(url, "_blank");
    };

    const handleImportSubmit = (e) => {
        e.preventDefault();

        if (!importFile) {
            Swal.fire({
                title: "Peringatan!",
                text: "Pilih file Excel terlebih dahulu.",
                icon: "warning",
            });

            return;
        }

        setImportProcessing(true);

        router.post(
            "/account/products/import",
            { file: importFile },
            {
                forceFormData: true,
                onFinish: () => {
                    setImportProcessing(false);
                    setShowImportModal(false);
                    setImportFile(null);
                },
            },
        );
    };

    return (
        <>
            <Head>
                <title>Produk - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-box me-2"></i>
                                    PRODUK
                                </h5>

                                <div>
                                    {hasAnyPermission(
                                        ["stock_movements.index"],
                                        allPermissions,
                                    ) && (
                                        <Link
                                            href="/account/stock-movements"
                                            className="btn btn-dark shadow-sm rounded-sm me-2"
                                        >
                                            <i className="fas fa-history me-2"></i>
                                            RIWAYAT STOK
                                        </Link>
                                    )}

                                    {hasAnyPermission(
                                        ["stock_movements.create"],
                                        allPermissions,
                                    ) && (
                                        <Link
                                            href="/account/stock-movements/create"
                                            className="btn btn-warning shadow-sm rounded-sm me-2 text-dark"
                                        >
                                            <i className="fas fa-exchange-alt me-2"></i>
                                            KOREKSI STOK
                                        </Link>
                                    )}

                                    {hasAnyPermission(
                                        ["products.create"],
                                        allPermissions,
                                    ) && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowImportModal(true)
                                                }
                                                className="btn btn-info shadow-sm rounded-sm me-2 text-white"
                                            >
                                                <i className="far fa-file-excel me-2"></i>
                                                IMPORT EXCEL
                                            </button>

                                            <Link
                                                href="/account/products/create"
                                                className="btn btn-success shadow-sm rounded-sm"
                                            >
                                                <i className="fas fa-plus-circle me-2"></i>
                                                TAMBAH PRODUK
                                            </Link>
                                        </>
                                    )}

                                    <button
                                        onClick={handlePrintSelected}
                                        className="btn btn-primary shadow-sm rounded-sm ms-2"
                                    >
                                        <i className="fas fa-print me-2"></i>
                                        CETAK BARCODE
                                    </button>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="mb-3">
                                    <Search URL={"/account/products"} />
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-bordered table-centered table-nowrap mb-0 rounded">
                                        <thead className="thead-dark text-white bg-dark text-center">
                                            <tr className="border-0">
                                                <th
                                                    className="border-0 align-middle text-center"
                                                    style={{ width: "3%" }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        onChange={
                                                            handleSelectAll
                                                        }
                                                        checked={
                                                            products.data
                                                                .length > 0 &&
                                                            selectedProducts.length ===
                                                                products.data
                                                                    .length
                                                        }
                                                    />
                                                </th>

                                                <th
                                                    className="border-0 align-middle"
                                                    style={{ width: "5%" }}
                                                >
                                                    No.
                                                </th>

                                                <th className="border-0 align-middle">
                                                    Barcode
                                                </th>

                                                <th className="border-0 align-middle">
                                                    Nama Produk
                                                </th>

                                                <th className="border-0 align-middle">
                                                    Kategori
                                                </th>

                                                <th className="border-0 align-middle">
                                                    Harga Jual (default)
                                                </th>

                                                <th className="border-0 align-middle">
                                                    Stok
                                                </th>

                                                <th
                                                    className="border-0 align-middle"
                                                    style={{ width: "18%" }}
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {products.data.length > 0 ? (
                                                products.data.map(
                                                    (product, index) => (
                                                        <tr key={product.id}>
                                                            <td className="align-middle text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={selectedProducts.includes(
                                                                        product.id,
                                                                    )}
                                                                    onChange={() =>
                                                                        handleSelect(
                                                                            product.id,
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="fw-bold text-center align-middle">
                                                                {index +
                                                                    1 +
                                                                    (products.current_page -
                                                                        1) *
                                                                        products.per_page}
                                                            </td>

                                                            <td className="align-middle text-center">
                                                                <div className="d-flex justify-content-center">
                                                                    <img
                                                                        src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${product.barcode}&scale=2&height=10&includetext`}
                                                                        alt={
                                                                            product.barcode
                                                                        }
                                                                        style={{
                                                                            height: "40px",
                                                                        }}
                                                                        className="rounded-1"
                                                                    />
                                                                </div>
                                                            </td>

                                                            <td className="align-middle text-center">
                                                                <div className="d-flex align-items-center justify-content-center">
                                                                    <img
                                                                        src={
                                                                            product.image
                                                                        }
                                                                        width="40"
                                                                        className="rounded-3 shadow-sm me-3"
                                                                        alt={
                                                                            product.title
                                                                        }
                                                                    />

                                                                    <span className="fw-bold">
                                                                        {
                                                                            product.title
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            <td className="align-middle text-center">
                                                                {
                                                                    product
                                                                        .category
                                                                        ?.name
                                                                }
                                                            </td>

                                                            <td className="align-middle text-center">
                                                                {product.product_type === "ppob" ? (
                                                                    <span className="text-muted">—</span>
                                                                ) : (
                                                                    <>
                                                                        {formatRupiah(
                                                                            product.default_sell_unit?.sell_price ?? product.sell_price,
                                                                        )}
                                                                        {(product.default_sell_unit?.unit?.abbreviation || product.unit) && (
                                                                            <small className="d-block text-muted">
                                                                                / {product.default_sell_unit?.unit?.abbreviation ?? product.unit}
                                                                            </small>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </td>

                                                            <td className="text-center align-middle">
                                                                <span
                                                                    className={`badge shadow-sm ${
                                                                        product.stock >
                                                                        0
                                                                            ? "bg-success"
                                                                            : "bg-danger"
                                                                    }`}
                                                                >
                                                                    {product.stock >
                                                                    0
                                                                        ? `${product.stock} ${product.unit}`
                                                                        : "Stok Habis"}
                                                                </span>
                                                            </td>

                                                            <td className="text-center align-middle">
                                                                {hasAnyPermission(
                                                                    [
                                                                        "stock_movements.create",
                                                                    ],
                                                                    allPermissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/stock-movements/create?product_id=${product.id}`}
                                                                        className="btn btn-warning btn-sm me-2 shadow-sm text-dark"
                                                                        title="Koreksi Stok"
                                                                    >
                                                                        <i className="fas fa-exchange-alt"></i>
                                                                    </Link>
                                                                )}

                                                                {hasAnyPermission(
                                                                    [
                                                                        "products.edit",
                                                                    ],
                                                                    allPermissions,
                                                                ) && (
                                                                    <Link
                                                                        href={`/account/products/${product.id}/edit`}
                                                                        className="btn btn-primary btn-sm me-2 shadow-sm"
                                                                    >
                                                                        <i className="fas fa-pencil-alt"></i>
                                                                    </Link>
                                                                )}

                                                                {hasAnyPermission(
                                                                    [
                                                                        "products.delete",
                                                                    ],
                                                                    allPermissions,
                                                                ) && (
                                                                    <Delete
                                                                        URL="/account/products"
                                                                        id={
                                                                            product.id
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
                                                        colSpan="8"
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
                                        links={products.links}
                                        align="end"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Modal
                    show={showImportModal}
                    onHide={() => setShowImportModal(false)}
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <i className="far fa-file-excel me-2"></i>
                            Import Produk dari Excel
                        </Modal.Title>
                    </Modal.Header>

                    <form onSubmit={handleImportSubmit}>
                        <Modal.Body>
                            <p className="text-muted small mb-3">
                                Unduh template, isi data produk, lalu unggah
                                file .xlsx, .xls, atau .csv. Barcode yang sudah
                                ada akan dilewati.
                            </p>

                            <div className="mb-3">
                                <a
                                    href="/account/products/import/template"
                                    className="btn btn-outline-secondary btn-sm"
                                >
                                    <i className="fas fa-download me-2"></i>
                                    Unduh Template Excel
                                </a>
                            </div>

                            <div className="mb-2">
                                <label
                                    htmlFor="import-file"
                                    className="form-label fw-semibold"
                                >
                                    File Excel
                                </label>
                                <input
                                    id="import-file"
                                    type="file"
                                    className="form-control"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) =>
                                        setImportFile(
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </div>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button
                                variant="secondary"
                                onClick={() => setShowImportModal(false)}
                                disabled={importProcessing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="info"
                                className="text-white"
                                disabled={importProcessing}
                            >
                                {importProcessing ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin me-2"></i>
                                        Mengimpor...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-upload me-2"></i>
                                        Import
                                    </>
                                )}
                            </Button>
                        </Modal.Footer>
                    </form>
                </Modal>
            </LayoutAccount>
        </>
    );
}
