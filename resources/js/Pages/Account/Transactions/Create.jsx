import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import LayoutAccount from "../../../Layouts/Account";
import Swal from "sweetalert2";
import { formatRupiah } from "../../../Utils/format";

export default function TransactionCreate() {
    const {
        products = { data: [], links: [] },
        carts = [],
        categories = [],
        customers = [],
        ppobSettings = { ppob_admin_fee: 2000 },
        ppobAccount = null,
        errors = {},
        flash = {},
    } = usePage().props;

    const params = new URLSearchParams(window.location.search);

    const [categoryId, setCategoryId] = useState(
        params.get("category_id") || "",
    );
    const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
    const [customerId, setCustomerId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState("nominal");
    const [cash, setCash] = useState("");
    const [ppobModalProduct, setPpobModalProduct] = useState(null);
    const [unitModalProduct, setUnitModalProduct] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState("");
    const [customerRef, setCustomerRef] = useState("");
    const [ppobCost, setPpobCost] = useState("");
    const [adminFee, setAdminFee] = useState(String(ppobSettings.ppob_admin_fee || 2000));

    // Auto-add barcode scan: if search yields exactly 1 product with exact barcode match
    useEffect(() => {
        const q = params.get("q");
        if (!q || products.data.length !== 1) return;

        const product = products.data[0];
        if (product.barcode !== q) return;

        // Auto-add to cart then clear search
        addToCart(product);
        router.get(
            "/account/transactions/create",
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, [products.data]);

    const subtotal = useMemo(
        () =>
            carts.reduce(
                (total, cart) =>
                    total + Number(cart.price || 0) * Number(cart.qty || 0),
                0,
            ),
        [carts],
    );

    const discountValue = Number(discount || 0);
    const discountAmount = discountType === "percent"
        ? Math.round(subtotal * discountValue / 100)
        : discountValue;
    const grandTotal = Math.max(subtotal - discountAmount, 0);
    const cashValue = Number(cash || 0);
    const change =
        paymentMethod === "cash" && cashValue >= grandTotal
            ? cashValue - grandTotal
            : 0;

    const cartQty = carts.reduce(
        (total, cart) => total + Number(cart.qty || 0),
        0,
    );

    const cashOptions = useMemo(() => {
        if (paymentMethod !== "cash" || grandTotal <= 0) {
            return [];
        }

        const roundTo = (n, to) => Math.ceil(n / to) * to;
        const options = [
            grandTotal,
            roundTo(grandTotal, 1000),
            roundTo(grandTotal, 2000),
            roundTo(grandTotal, 5000),
            roundTo(grandTotal, 10000),
            roundTo(grandTotal, 20000),
            roundTo(grandTotal, 50000),
            roundTo(grandTotal, 100000),
        ];
        return [...new Set(options)]
            .filter((value) => value >= grandTotal)
            .slice(0, 5);
    }, [grandTotal, paymentMethod]);

    const visitProductList = (nextCategoryId, nextSearchQuery) => {
        const query = new URLSearchParams();
        const trimmedSearch = nextSearchQuery.trim();

        if (trimmedSearch) {
            query.set("q", trimmedSearch);
        }

        if (nextCategoryId) {
            query.set("category_id", nextCategoryId);
        }

        router.get(
            `/account/transactions/create${query.toString() ? `?${query.toString()}` : ""}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();

        visitProductList(categoryId, searchQuery);
    };

    const handleCategoryClick = (id) => {
        setCategoryId(id);

        visitProductList(id, searchQuery);
    };

    const serviceComponentBlocked = (product) => {
        const recipe = product.components || [];

        if (recipe.length === 0) {
            return true;
        }

        return recipe.some((row) => {
            const component = row.component_product || row.componentProduct;

            return !component || Number(component.stock || 0) < Number(row.qty_per_unit || 0);
        });
    };

    const serviceComponentLow = (product) => {
        const recipe = product.components || [];

        return recipe.some((row) => {
            const component = row.component_product || row.componentProduct;

            return component && Number(component.stock || 0) <= 10;
        });
    };

    const addToCart = (product) => {
        if (product.product_type === "ppob") {
            setPpobModalProduct(product);
            setCustomerRef("");
            setPpobCost("");
            setAdminFee(String(ppobSettings.ppob_admin_fee || 2000));
            return;
        }

        const units = product.product_units || [];
        if (units.length > 1) {
            setUnitModalProduct(product);
            setSelectedUnitId(String(product.default_sell_unit?.unit_id || units.find((u) => u.is_default_sell)?.unit_id || units[0]?.unit_id || ""));
            return;
        }

        router.post("/account/carts", {
            product_id: product.id,
            unit_id: units[0]?.unit_id || null,
        }, { preserveState: true, preserveScroll: true, only: ["carts"] });
    };

    const submitPpobCart = (e) => {
        e.preventDefault();
        router.post("/account/carts", {
            product_id: ppobModalProduct.id,
            customer_ref: customerRef,
            ppob_cost: ppobCost,
            admin_fee: adminFee,
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ["carts"],
            onSuccess: () => setPpobModalProduct(null),
        });
    };

    const submitUnitCart = (e) => {
        e.preventDefault();
        router.post("/account/carts", {
            product_id: unitModalProduct.id,
            unit_id: selectedUnitId,
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ["carts"],
            onSuccess: () => setUnitModalProduct(null),
        });
    };

    const updateCart = (cartId, newQty) => {
        if (newQty < 1) {
            deleteCart(cartId);
            return;
        }

        router.put(
            `/account/carts/${cartId}`,
            { qty: newQty },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["carts"],
            },
        );
    };

    const deleteCart = (cartId) => {
        router.delete(`/account/carts/${cartId}`, {
            preserveState: true,
            preserveScroll: true,
            only: ["carts"],
        });
    };

    const debounceTimers = useRef({});

    const handleQtyChange = (cartId, rawValue) => {
        const newQty = parseInt(rawValue, 10);

        if (debounceTimers.current[cartId]) {
            clearTimeout(debounceTimers.current[cartId]);
        }

        if (isNaN(newQty) || newQty < 1) return;

        debounceTimers.current[cartId] = setTimeout(() => {
            updateCart(cartId, newQty);
        }, 500);
    };

    // Keyboard shortcuts: F2 = bayar, F3 = fokus search, Esc = tutup modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "F2" || e.key === "f2") {
                e.preventDefault();
                storeTransaction(e);
            } else if (e.key === "F3" || e.key === "f3") {
                e.preventDefault();
                document.querySelector(".pos-search-bar input")?.focus();
            } else if (e.key === "Escape") {
                if (ppobModalProduct) {
                    setPpobModalProduct(null);
                } else if (unitModalProduct) {
                    setUnitModalProduct(null);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [ppobModalProduct, unitModalProduct, carts, paymentMethod, discountValue, discountType, cashValue, customerId]);

    const openMidtransPopup = (snapToken, invoice) => {
        if (!window.snap) {
            Swal.fire(
                "Error!",
                "Snap JS Midtrans belum siap. Pastikan script Snap sudah ditambahkan di app.blade.php.",
                "error",
            );
            return;
        }

        window.snap.pay(snapToken, {
            onSuccess: function () {
                router.get(`/account/transactions/${invoice}`);
            },
            onPending: function () {
                router.get(`/account/transactions/${invoice}`);
            },
            onError: function () {
                Swal.fire(
                    "Error!",
                    "Pembayaran digital gagal diproses.",
                    "error",
                );
            },
            onClose: function () {
                Swal.fire({
                    title: "Pembayaran Belum Selesai",
                    text: "Transaksi sudah dibuat dengan status pending.",
                    icon: "info",
                    timer: 1800,
                    showConfirmButton: false,
                }).then(() => {
                    router.get(`/account/transactions/${invoice}`);
                });
            },
        });
    };

    const storeTransaction = (e) => {
        e.preventDefault();

        if (carts.length === 0) {
            Swal.fire({
                title: "Error!",
                text: "Keranjang masih kosong!",
                icon: "error",
                timer: 1500,
                showConfirmButton: false,
            });
            return;
        }

        if (discountAmount > subtotal) {
            Swal.fire({
                title: "Error!",
                text: "Diskon tidak boleh melebihi subtotal.",
                icon: "error",
                timer: 1500,
                showConfirmButton: false,
            });
            return;
        }

        if (paymentMethod === "cash" && cashValue < grandTotal) {
            Swal.fire({
                title: "Error!",
                text: "Uang pembayaran kurang!",
                icon: "error",
                timer: 1500,
                showConfirmButton: false,
            });
            return;
        }

        Swal.fire({
            title: "Proses Pembayaran?",
            text:
                paymentMethod === "cash"
                    ? "Pastikan uang yang diterima sudah sesuai."
                    : "Pembayaran digital akan diproses melalui Midtrans.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, Bayar!",
        }).then(async (result) => {
            if (!result.isConfirmed) {
                return;
            }

            try {
                const response = await fetch("/account/transactions", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        customer_id: customerId,
                        discount: discountValue,
                        discount_type: discountType,
                        cash: paymentMethod === "cash" ? cashValue : 0,
                        payment_method: paymentMethod,
                    }),
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Terjadi kesalahan sistem.",
                    );
                }

                if (data.payment_method === "digital") {
                    if (!data.snap_token) {
                        throw new Error("Snap token tidak tersedia.");
                    }

                    openMidtransPopup(data.snap_token, data.invoice);
                    return;
                }

                router.get(`/account/transactions/${data.invoice}`);
            } catch (error) {
                Swal.fire(
                    "Error!",
                    error.message || "Terjadi kesalahan sistem.",
                    "error",
                );
            }
        });
    };

    return (
        <>
            <Head>
                <title>POS Kasir - ZenPOS</title>
            </Head>

            <LayoutAccount>
                <div className="pos-cashier-page">
                    <div className="pos-cashier-heading">
                        <div>
                            <h4>POS Kasir</h4>
                            <span>{cartQty} item dalam keranjang</span>
                        </div>

                        <Link
                            href="/account/transactions"
                            className="btn btn-outline-secondary btn-sm"
                        >
                            <i className="fas fa-receipt me-2"></i>
                            Riwayat
                        </Link>
                    </div>

                    <div className="row g-3">
                        <div className="col-12 col-xl-8">
                            <section className="pos-sale-panel">
                                <form
                                    className="pos-search-bar"
                                    onSubmit={handleSearch}
                                >
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="fas fa-search"></i>
                                        </span>

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Scan barcode atau cari produk"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            autoFocus
                                        />

                                        <button
                                            className="btn btn-success"
                                            type="submit"
                                        >
                                            Cari
                                        </button>
                                    </div>
                                </form>

                                <div className="pos-category-strip">
                                    <button
                                        type="button"
                                        className={`pos-category-pill ${
                                            String(categoryId) === ""
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() => handleCategoryClick("")}
                                    >
                                        Semua
                                    </button>

                                    {categories.map((category) => (
                                        <button
                                            type="button"
                                            key={category.id}
                                            className={`pos-category-pill ${
                                                String(categoryId) ===
                                                String(category.id)
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleCategoryClick(category.id)
                                            }
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>

                                <div className="pos-product-grid">
                                    {products.data.length > 0 ? (
                                        products.data.map((product) => {
                                            const isPpob = product.product_type === "ppob";
                                            const isService = product.product_type === "service";
                                            const defaultUnit = product.default_sell_unit || product.product_units?.find((u) => u.is_default_sell);
                                            const displayPrice = defaultUnit?.sell_price ?? product.sell_price;
                                            const componentBlocked = isService && serviceComponentBlocked(product);
                                            const disabled = isPpob
                                                ? false
                                                : isService
                                                  ? componentBlocked
                                                  : product.stock < 1;

                                            return (
                                            <button
                                                type="button"
                                                className={`pos-product-tile ${disabled ? "is-disabled" : ""}`}
                                                key={product.id}
                                                onClick={() => !disabled && addToCart(product)}
                                                disabled={disabled}
                                            >
                                                <span className="pos-product-image">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.title} />
                                                    ) : (
                                                        <i className={`fa ${isPpob ? "fa-bolt" : isService ? "fa-print" : "fa-box"}`}></i>
                                                    )}
                                                    {disabled && (
                                                        <span className="pos-product-empty">
                                                            {isService ? "Bahan habis" : "Habis"}
                                                        </span>
                                                    )}
                                                    {isPpob && (
                                                        <span className="badge bg-info position-absolute top-0 end-0 m-1">PPOB</span>
                                                    )}
                                                    {isService && !disabled && serviceComponentLow(product) && (
                                                        <span className="badge bg-warning text-dark position-absolute top-0 end-0 m-1">Bahan menipis</span>
                                                    )}
                                                    {isService && (
                                                        <span className="badge bg-secondary position-absolute top-0 start-0 m-1">Layanan</span>
                                                    )}
                                                </span>
                                                <span className="pos-product-name">{product.title}</span>
                                                <span className="pos-product-meta">
                                                    <span>
                                                        {isPpob
                                                            ? "Digital"
                                                            : isService
                                                              ? "Pakai bahan baku"
                                                              : `Stok ${product.stock}`}
                                                    </span>
                                                    <strong>{isPpob ? "Modal+Fee" : formatRupiah(displayPrice)}</strong>
                                                </span>
                                            </button>
                                        );})
                                    ) : (
                                        <div className="pos-empty-state">
                                            <i className="fas fa-box-open"></i>
                                            <strong>
                                                Produk tidak ditemukan
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                {products.links.length > 0 && (
                                    <div className="pos-pagination">
                                        <ul className="pagination pagination-sm mb-0">
                                            {products.links.map(
                                                (link, index) => (
                                                    <li
                                                        key={index}
                                                        className={`page-item ${
                                                            link.active
                                                                ? "active"
                                                                : ""
                                                        } ${
                                                            link.url === null
                                                                ? "disabled"
                                                                : ""
                                                        }`}
                                                    >
                                                        <Link
                                                            className="page-link"
                                                            href={
                                                                link.url || "#"
                                                            }
                                                            dangerouslySetInnerHTML={{
                                                                __html: link.label,
                                                            }}
                                                            preserveState
                                                            preserveScroll
                                                        />
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="col-12 col-xl-4">
                            <section className="pos-checkout-panel">
                                <div className="pos-checkout-header">
                                    <div>
                                        <h5>Keranjang</h5>
                                        <span>
                                            {carts.length} baris transaksi
                                        </span>
                                    </div>

                                    <span className="pos-cart-count">
                                        {cartQty}
                                    </span>
                                </div>

                                {(errors.error || flash?.error) && (
                                    <div className="alert alert-danger mx-3 mt-3 mb-0">
                                        {errors.error || flash.error}
                                    </div>
                                )}

                                {ppobAccount && (
                                    <div className={`alert mx-3 mt-3 mb-0 ${ppobAccount.is_low_balance ? "alert-danger" : "alert-secondary"}`}>
                                        Saldo PPOB ({ppobAccount.name}): <strong>{formatRupiah(ppobAccount.current_balance)}</strong>
                                    </div>
                                )}

                                <div className="pos-cart-list">
                                    {carts.length > 0 ? (
                                        carts.map((cart) => (
                                            <div
                                                className="pos-cart-row"
                                                key={cart.id}
                                            >
                                                <div className="pos-cart-main">
                                                    <strong>{cart.product.title}</strong>
                                                    <span>
                                                        {cart.ppob_cost != null ? (
                                                            <>Modal {formatRupiah(cart.ppob_cost)} + Fee {formatRupiah(cart.admin_fee)}</>
                                                        ) : (
                                                            <>
                                                                {cart.unit?.abbreviation || cart.product.unit} · {formatRupiah(cart.price)}
                                                            </>
                                                        )}
                                                    </span>
                                                    {cart.customer_ref && (
                                                        <small className="text-muted d-block">Ref: {cart.customer_ref}</small>
                                                    )}
                                                </div>

                                                <div className="pos-cart-actions">
                                                    <div className="pos-qty-stepper">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateCart(
                                                                    cart.id,
                                                                    cart.qty -
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            <i className="fas fa-minus"></i>
                                                        </button>

                                                        <input
                                                            type="number"
                                                            className="pos-qty-input"
                                                            value={cart.qty}
                                                            min="1"
                                                            onChange={(e) =>
                                                                handleQtyChange(
                                                                    cart.id,
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateCart(
                                                                    cart.id,
                                                                    cart.qty +
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            <i className="fas fa-plus"></i>
                                                        </button>
                                                    </div>

                                                    <strong>
                                                        {formatRupiah(
                                                            cart.price *
                                                                cart.qty,
                                                        )}
                                                    </strong>

                                                    <button
                                                        type="button"
                                                        className="pos-cart-delete"
                                                        onClick={() =>
                                                            deleteCart(cart.id)
                                                        }
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="pos-empty-cart">
                                            <i className="fas fa-shopping-basket"></i>
                                            <strong>Keranjang kosong</strong>
                                            <span>
                                                Item belanja akan tampil di
                                                bagian ini.
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <form
                                    className="pos-payment-form"
                                    onSubmit={storeTransaction}
                                >
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Metode Pembayaran
                                        </label>

                                        <div className="pos-method-toggle">
                                            <input
                                                type="radio"
                                                className="btn-check"
                                                name="payment_method"
                                                id="payment-cash"
                                                value="cash"
                                                checked={
                                                    paymentMethod === "cash"
                                                }
                                                onChange={(e) =>
                                                    setPaymentMethod(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <label
                                                className="pos-method-option"
                                                htmlFor="payment-cash"
                                            >
                                                Tunai
                                            </label>

                                            <input
                                                type="radio"
                                                className="btn-check"
                                                name="payment_method"
                                                id="payment-digital"
                                                value="digital"
                                                checked={
                                                    paymentMethod === "digital"
                                                }
                                                onChange={(e) => {
                                                    setPaymentMethod(
                                                        e.target.value,
                                                    );
                                                    setCash("");
                                                }}
                                            />
                                            <label
                                                className="pos-method-option"
                                                htmlFor="payment-digital"
                                            >
                                                Digital
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Pelanggan
                                        </label>
                                        <select
                                            className="form-select"
                                            value={customerId}
                                            onChange={(e) =>
                                                setCustomerId(e.target.value)
                                            }
                                        >
                                            <option value="">Umum</option>
                                            {customers.map((customer) => (
                                                <option
                                                    value={customer.id}
                                                    key={customer.id}
                                                >
                                                    {customer.name} -{" "}
                                                    {customer.no_telp}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="row g-2 mb-3">
                                        <div
                                            className={
                                                paymentMethod === "cash"
                                                    ? "col-5"
                                                    : "col-12"
                                            }
                                        >
                                            <label className="form-label">
                                                Diskon
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={discount}
                                                    onChange={(e) =>
                                                        setDiscount(e.target.value)
                                                    }
                                                    min="0"
                                                />
                                                <button
                                                    type="button"
                                                    className={`btn btn-outline-secondary ${discountType === "percent" ? "active" : ""}`}
                                                    style={{ width: "4rem" }}
                                                    onClick={() => setDiscountType(
                                                        discountType === "nominal" ? "percent" : "nominal"
                                                    )}
                                                    title={discountType === "nominal" ? "Ubah ke persen" : "Ubah ke nominal"}
                                                >
                                                    {discountType === "nominal" ? "Rp" : "%"}
                                                </button>
                                            </div>
                                        </div>

                                        {paymentMethod === "cash" && (
                                            <div className="col-7">
                                                <label className="form-label">
                                                    Uang Tunai
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control pos-cash-input"
                                                    value={cash}
                                                    onChange={(e) =>
                                                        setCash(e.target.value)
                                                    }
                                                    min="0"
                                                    required
                                                />

                                                {cashOptions.length > 0 && (
                                                    <div className="pos-cash-shortcuts">
                                                        {cashOptions.map(
                                                            (option, index) => (
                                                                <button
                                                                    type="button"
                                                                    key={option}
                                                                    onClick={() =>
                                                                        setCash(
                                                                            String(
                                                                                option,
                                                                            ),
                                                                        )
                                                                    }
                                                                >
                                                                    {index === 0
                                                                        ? "Pas"
                                                                        : formatRupiah(
                                                                              option,
                                                                          )}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {paymentMethod === "digital" && (
                                        <div className="alert alert-info small">
                                            Pembayaran digital akan diproses
                                            melalui Midtrans. Kasir tidak perlu
                                            mengisi uang tunai.
                                        </div>
                                    )}

                                    <div className="pos-summary-box">
                                        <div>
                                            <span>Subtotal</span>
                                            <strong>
                                                {formatRupiah(subtotal)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Diskon</span>
                                            <strong className="text-danger">
                                                -{formatRupiah(discountAmount)}
                                            </strong>
                                        </div>

                                        <div className="pos-summary-total">
                                            <span>Total</span>
                                            <strong>
                                                {formatRupiah(grandTotal)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                {paymentMethod === "cash"
                                                    ? "Kembalian"
                                                    : "Status"}
                                            </span>
                                            <strong className="text-success">
                                                {paymentMethod === "cash"
                                                    ? formatRupiah(change)
                                                    : "Menunggu pembayaran"}
                                            </strong>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-success btn-lg w-100 pos-pay-button"
                                        disabled={carts.length === 0}
                                    >
                                        <i className="fas fa-check-circle me-2"></i>
                                        Proses Pembayaran
                                    </button>
                                </form>
                            </section>
                        </div>
                    </div>
                </div>

                {ppobModalProduct && (
                    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <form onSubmit={submitPpobCart}>
                                    <div className="modal-header">
                                        <h5 className="modal-title">{ppobModalProduct.title}</h5>
                                        <button type="button" className="btn-close" onClick={() => setPpobModalProduct(null)}></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">No. Pelanggan / Meter / HP (Opsional)</label>
                                            <input type="text" className="form-control" value={customerRef} onChange={(e) => setCustomerRef(e.target.value)} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Harga Modal *</label>
                                            <input type="number" min="1" className="form-control" value={ppobCost} onChange={(e) => setPpobCost(e.target.value)} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Admin Fee *</label>
                                            <input type="number" min="0" className="form-control" value={adminFee} onChange={(e) => setAdminFee(e.target.value)} required />
                                        </div>
                                        <div className="alert alert-light mb-0">
                                            Harga Jual: <strong>{formatRupiah(Number(ppobCost || 0) + Number(adminFee || 0))}</strong>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setPpobModalProduct(null)}>Batal</button>
                                        <button type="submit" className="btn btn-success">Tambah ke Keranjang</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {unitModalProduct && (
                    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <form onSubmit={submitUnitCart}>
                                    <div className="modal-header">
                                        <h5 className="modal-title">Pilih Satuan</h5>
                                        <button type="button" className="btn-close" onClick={() => setUnitModalProduct(null)}></button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="mb-2">{unitModalProduct.title}</p>
                                        <select className="form-select" value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)} required>
                                            {(unitModalProduct.product_units || []).map((row) => (
                                                <option key={row.id} value={row.unit_id}>
                                                    {row.unit?.name} ({row.unit?.abbreviation}) - {formatRupiah(row.sell_price)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setUnitModalProduct(null)}>Batal</button>
                                        <button type="submit" className="btn btn-success">Tambah</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </LayoutAccount>
        </>
    );
}
