import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Button, Drawer, Modal, notification, Spin } from "antd";
import { FileTextOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import LayoutAccount from "../../../Layouts/Account";
import useMobile from "../../../Hooks/useMobile";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { formatRupiah } from "../../../Utils/format";
import { getModalWidth } from "../../../Utils/responsive";
import PosProductGrid from "../../../Components/Pos/PosProductGrid";
import PosCartPanel from "../../../Components/Pos/PosCartPanel";
import PosPaymentSummary from "../../../Components/Pos/PosPaymentSummary";
import PosPpobModal from "../../../Components/Pos/PosPpobModal";
import PosUnitModal from "../../../Components/Pos/PosUnitModal";
import PosQuickCustomerModal from "../../../Components/Pos/PosQuickCustomerModal";
import BarcodeScanner from "../../../Components/BarcodeScanner";
import { lineNet } from "../../../Components/Pos/posUtils";

export default function TransactionCreate() {
    const {
        products = { data: [], links: [] },
        carts = [],
        ppobSettings = { ppob_admin_fee: 2000 },
        ppobAccount = null,
        errors = {},
        flash = {},
    } = usePage().props;

    const params = new URLSearchParams(window.location.search);
    const searchInputRef = useRef(null);

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
    const [adminFee, setAdminFee] = useState(
        String(ppobSettings.ppob_admin_fee || 2000),
    );

    const [customerSearch, setCustomerSearch] = useState("");
    const [customerResults, setCustomerResults] = useState([]);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [quickCustomerName, setQuickCustomerName] = useState("");
    const [quickCustomerPhone, setQuickCustomerPhone] = useState("");
    const customerSearchTimer = useRef(null);
    const debounceTimers = useRef({});
    const discountTimers = useRef({});

    const isMobile = useMobile();
    const loading = useInertiaLoading();
    const [localCarts, setLocalCarts] = useState(carts);

    useEffect(() => {
        setLocalCarts(carts);
    }, [carts]);

    const inertiaCartOptions = (snapshot, extra = {}) => ({
        preserveState: true,
        preserveScroll: true,
        only: ["carts"],
        onError: () => {
            setLocalCarts(snapshot);
            notification.error({
                message: "Gagal",
                description:
                    "Perubahan keranjang gagal. Data dikembalikan.",
                duration: 2,
            });
        },
        ...extra,
    });

    useEffect(() => {
        const q = params.get("q");
        if (!q || products.data.length !== 1) return;

        const product = products.data[0];
        if (product.barcode !== q) return;

        addToCart(product);
        resetProductSearch();
    }, [products.data]);

    const isCashLikePayment = ["cash", "qris"].includes(paymentMethod);

    const activeCarts = useMemo(
        () => localCarts.filter((cart) => !cart.is_held),
        [localCarts],
    );

    const heldCarts = useMemo(
        () => localCarts.filter((cart) => cart.is_held),
        [localCarts],
    );

    const subtotal = useMemo(
        () => activeCarts.reduce((total, cart) => total + lineNet(cart), 0),
        [activeCarts],
    );

    const discountValue = Number(discount || 0);
    const discountAmount =
        discountType === "percent"
            ? Math.round((subtotal * discountValue) / 100)
            : discountValue;
    const grandTotal = Math.max(subtotal - discountAmount, 0);
    const cashValue = Number(cash || 0);
    const change =
        isCashLikePayment && cashValue >= grandTotal
            ? cashValue - grandTotal
            : 0;

    const cartQty = activeCarts.reduce(
        (total, cart) => total + Number(cart.qty || 0),
        0,
    );

    const cashOptions = useMemo(() => {
        if (!isCashLikePayment || grandTotal <= 0) {
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
    }, [grandTotal, isCashLikePayment]);

    const resetProductSearch = () => {
        setSearchQuery("");
        router.get(
            "/account/transactions/create",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["products"],
            },
        );
    };

    const visitProductList = (nextSearchQuery) => {
        const query = new URLSearchParams();
        const trimmedSearch = nextSearchQuery.trim();

        if (trimmedSearch) {
            query.set("q", trimmedSearch);
        }

        router.get(
            `/account/transactions/create${query.toString() ? `?${query.toString()}` : ""}`,
            {},
            { preserveState: true, preserveScroll: true, only: ["products"] },
        );
    };

    const handleSearchDebounced = useCallback((query) => {
        visitProductList(query);
    }, []);

    const handleSearchQueryChange = useCallback((value) => {
        setSearchQuery(value);

        if (!value.trim()) {
            router.get(
                "/account/transactions/create",
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ["products"],
                },
            );
        }
    }, []);

    const handleBarcodeScan = (barcode) => {
        setShowBarcodeScanner(false);
        setSearchQuery(barcode);

        const query = new URLSearchParams({ q: barcode });

        router.get(
            `/account/transactions/create?${query.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ["products"],
                onSuccess: (page) => {
                    const found = page.props.products?.data ?? [];
                    const match = found.find(
                        (product) => product.barcode === barcode,
                    );

                    if (match) {
                        addToCart(match);
                        resetProductSearch();
                        return;
                    }

                    notification.warning({
                        message: "Produk tidak ditemukan",
                        description: `Barcode ${barcode} tidak terdaftar.`,
                        duration: 2,
                    });
                },
            },
        );
    };

    const handleCustomerSearch = (value) => {
        setCustomerSearch(value);

        if (customerSearchTimer.current) {
            clearTimeout(customerSearchTimer.current);
        }

        if (!value || value.trim().length < 1) {
            setCustomerResults([]);
            setShowCustomerDropdown(false);
            return;
        }

        customerSearchTimer.current = setTimeout(async () => {
            setCustomerLoading(true);
            try {
                const response = await fetch(
                    `/account/customers/search?q=${encodeURIComponent(value.trim())}`,
                    {
                        headers: {
                            Accept: "application/json",
                            "X-CSRF-TOKEN":
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute("content") || "",
                        },
                    },
                );
                const data = await response.json();
                setCustomerResults(data);
                setShowCustomerDropdown(true);
            } catch {
                setCustomerResults([]);
            } finally {
                setCustomerLoading(false);
            }
        }, 300);
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerId(String(customer.id));
        setCustomerSearch(customer.name);
        setShowCustomerDropdown(false);
    };

    const clearCustomer = () => {
        setSelectedCustomer(null);
        setCustomerId("");
        setCustomerSearch("");
        setCustomerResults([]);
        setShowCustomerDropdown(false);
    };

    const submitQuickCreateCustomer = async (e) => {
        e.preventDefault();

        if (!quickCustomerName.trim()) return;

        try {
            const response = await fetch("/account/customers", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                body: JSON.stringify({
                    name: quickCustomerName.trim(),
                    no_telp: quickCustomerPhone.trim() || null,
                }),
            });

            if (response.ok && response.redirected) {
                const searchResponse = await fetch(
                    `/account/customers/search?q=${encodeURIComponent(quickCustomerName.trim())}`,
                    {
                        headers: {
                            Accept: "application/json",
                            "X-CSRF-TOKEN":
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute("content") || "",
                        },
                    },
                );
                const customers = await searchResponse.json();
                if (customers.length > 0) {
                    selectCustomer(customers[0]);
                }
                setShowQuickCreateModal(false);
                setQuickCustomerName("");
                setQuickCustomerPhone("");
            } else {
                const data = await response.json().catch(() => ({}));
                notification.error({
                    message: "Error",
                    description:
                        data.message || "Gagal menambah pelanggan.",
                });
            }
        } catch {
            notification.error({
                message: "Error",
                description: "Gagal menambah pelanggan.",
            });
        }
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
            setSelectedUnitId(
                String(
                    product.default_sell_unit?.unit_id ||
                        units.find((u) => u.is_default_sell)?.unit_id ||
                        units[0]?.unit_id ||
                        "",
                ),
            );
            return;
        }

        const unitId = units[0]?.unit_id || null;
        const price = Number(units[0]?.sell_price ?? product.sell_price ?? 0);
        const snapshot = localCarts;
        const existing = localCarts.find(
            (cart) =>
                !cart.is_held &&
                cart.product_id === product.id &&
                Number(cart.unit_id || 0) === Number(unitId || 0) &&
                cart.ppob_cost == null,
        );

        if (existing) {
            setLocalCarts((prev) =>
                prev.map((cart) =>
                    cart.id === existing.id
                        ? { ...cart, qty: Number(cart.qty || 0) + 1 }
                        : cart,
                ),
            );
        } else {
            setLocalCarts((prev) => [
                ...prev,
                {
                    id: `temp-${Date.now()}`,
                    product_id: product.id,
                    unit_id: unitId,
                    qty: 1,
                    price,
                    product,
                    unit: units[0]?.unit || null,
                    is_held: false,
                    discount: 0,
                    discount_type: "nominal",
                    ppob_cost: null,
                    admin_fee: null,
                    customer_ref: null,
                },
            ]);
        }

        router.post(
            "/account/carts",
            { product_id: product.id, unit_id: unitId },
            inertiaCartOptions(snapshot),
        );

        resetProductSearch();
    };

    const submitPpobCart = (e) => {
        e.preventDefault();
        const snapshot = localCarts;
        const fee = Number(adminFee || 0);
        const cost = Number(ppobCost || 0);

        setLocalCarts((prev) => [
            ...prev,
            {
                id: `temp-${Date.now()}`,
                product_id: ppobModalProduct.id,
                unit_id: null,
                qty: 1,
                price: cost + fee,
                product: ppobModalProduct,
                unit: null,
                is_held: false,
                discount: 0,
                discount_type: "nominal",
                ppob_cost: cost,
                admin_fee: fee,
                customer_ref: customerRef || null,
            },
        ]);

        router.post(
            "/account/carts",
            {
                product_id: ppobModalProduct.id,
                customer_ref: customerRef,
                ppob_cost: ppobCost,
                admin_fee: adminFee,
            },
            inertiaCartOptions(snapshot, {
                onSuccess: () => {
                    setPpobModalProduct(null);
                    resetProductSearch();
                },
            }),
        );
    };

    const submitUnitCart = (e) => {
        e.preventDefault();
        const snapshot = localCarts;
        const units = unitModalProduct.product_units || [];
        const selectedUnit = units.find(
            (unit) => String(unit.unit_id) === String(selectedUnitId),
        );
        const price = Number(
            selectedUnit?.sell_price ?? unitModalProduct.sell_price ?? 0,
        );
        const existing = localCarts.find(
            (cart) =>
                !cart.is_held &&
                cart.product_id === unitModalProduct.id &&
                Number(cart.unit_id || 0) === Number(selectedUnitId || 0) &&
                cart.ppob_cost == null,
        );

        if (existing) {
            setLocalCarts((prev) =>
                prev.map((cart) =>
                    cart.id === existing.id
                        ? { ...cart, qty: Number(cart.qty || 0) + 1 }
                        : cart,
                ),
            );
        } else {
            setLocalCarts((prev) => [
                ...prev,
                {
                    id: `temp-${Date.now()}`,
                    product_id: unitModalProduct.id,
                    unit_id: Number(selectedUnitId) || null,
                    qty: 1,
                    price,
                    product: unitModalProduct,
                    unit: selectedUnit?.unit || null,
                    is_held: false,
                    discount: 0,
                    discount_type: "nominal",
                    ppob_cost: null,
                    admin_fee: null,
                    customer_ref: null,
                },
            ]);
        }

        router.post(
            "/account/carts",
            {
                product_id: unitModalProduct.id,
                unit_id: selectedUnitId,
            },
            inertiaCartOptions(snapshot, {
                onSuccess: () => {
                    setUnitModalProduct(null);
                    resetProductSearch();
                },
            }),
        );
    };

    const updateCart = (cartId, newQty) => {
        if (newQty < 1) {
            deleteCart(cartId);
            return;
        }

        if (String(cartId).startsWith("temp-")) {
            setLocalCarts((prev) =>
                prev.map((cart) =>
                    cart.id === cartId ? { ...cart, qty: newQty } : cart,
                ),
            );
            return;
        }

        const snapshot = localCarts;
        const current = localCarts.find((cart) => cart.id === cartId);

        setLocalCarts((prev) =>
            prev.map((cart) =>
                cart.id === cartId ? { ...cart, qty: newQty } : cart,
            ),
        );

        router.put(
            `/account/carts/${cartId}`,
            {
                qty: newQty,
                discount: current?.discount ?? 0,
                discount_type: current?.discount_type || "nominal",
            },
            inertiaCartOptions(snapshot),
        );
    };

    const deleteCart = (cartId) => {
        const snapshot = localCarts;
        setLocalCarts((prev) => prev.filter((cart) => cart.id !== cartId));

        if (String(cartId).startsWith("temp-")) {
            return;
        }

        router.delete(
            `/account/carts/${cartId}`,
            inertiaCartOptions(snapshot),
        );
    };

    const toggleCartHold = (cartId, isHeld) => {
        if (String(cartId).startsWith("temp-")) {
            return;
        }

        const snapshot = localCarts;
        setLocalCarts((prev) =>
            prev.map((cart) =>
                cart.id === cartId ? { ...cart, is_held: isHeld } : cart,
            ),
        );

        router.patch(
            `/account/carts/${cartId}/hold`,
            { is_held: isHeld },
            inertiaCartOptions(snapshot),
        );
    };

    const updateCartDiscount = (cartId, discountVal, type) => {
        if (String(cartId).startsWith("temp-")) {
            setLocalCarts((prev) =>
                prev.map((cart) =>
                    cart.id === cartId
                        ? { ...cart, discount: discountVal, discount_type: type }
                        : cart,
                ),
            );
            return;
        }

        const snapshot = localCarts;
        const current = localCarts.find((cart) => cart.id === cartId);

        setLocalCarts((prev) =>
            prev.map((cart) =>
                cart.id === cartId
                    ? { ...cart, discount: discountVal, discount_type: type }
                    : cart,
            ),
        );

        router.put(
            `/account/carts/${cartId}`,
            {
                qty: current?.qty || 1,
                discount: discountVal,
                discount_type: type,
            },
            inertiaCartOptions(snapshot),
        );
    };

    const handleDiscountChange = (cartId, rawValue, type) => {
        const value =
            typeof rawValue === "number"
                ? rawValue
                : parseInt(rawValue, 10);
        const discountVal = isNaN(value) || value < 0 ? 0 : value;

        setLocalCarts((prev) =>
            prev.map((cart) =>
                cart.id === cartId
                    ? { ...cart, discount: discountVal, discount_type: type }
                    : cart,
            ),
        );

        if (discountTimers.current[cartId]) {
            clearTimeout(discountTimers.current[cartId]);
        }

        discountTimers.current[cartId] = setTimeout(() => {
            updateCartDiscount(cartId, discountVal, type);
        }, 500);
    };

    const handleQtyChange = (cartId, rawValue, debounced = false) => {
        const newQty =
            typeof rawValue === "number" ? rawValue : parseInt(rawValue, 10);

        if (debounceTimers.current[cartId]) {
            clearTimeout(debounceTimers.current[cartId]);
        }

        if (isNaN(newQty) || newQty < 1) return;

        setLocalCarts((prev) =>
            prev.map((cart) =>
                cart.id === cartId ? { ...cart, qty: newQty } : cart,
            ),
        );

        if (debounced) {
            debounceTimers.current[cartId] = setTimeout(() => {
                updateCart(cartId, newQty);
            }, 500);
        } else {
            updateCart(cartId, newQty);
        }
    };

    const openMidtransPopup = (snapToken, invoice) => {
        if (!window.snap) {
            notification.error({
                message: "Error",
                description:
                    "Snap JS Midtrans belum siap. Pastikan script Snap sudah ditambahkan di app.blade.php.",
            });
            return;
        }

        window.snap.pay(snapToken, {
            onSuccess: () => router.get(`/account/transactions/${invoice}`),
            onPending: () => router.get(`/account/transactions/${invoice}`),
            onError: () => {
                notification.error({
                    message: "Error",
                    description: "Pembayaran digital gagal diproses.",
                });
            },
            onClose: () => {
                notification.info({
                    message: "Pembayaran Belum Selesai",
                    description:
                        "Transaksi sudah dibuat dengan status pending.",
                    duration: 1.8,
                });
                router.get(`/account/transactions/${invoice}`);
            },
        });
    };

    const storeTransaction = (e) => {
        e.preventDefault();

        if (activeCarts.length === 0) {
            notification.error({
                message: "Error",
                description: "Keranjang masih kosong!",
                duration: 1.5,
            });
            return;
        }

        if (activeCarts.some((cart) => String(cart.id).startsWith("temp-"))) {
            notification.info({
                message: "Sebentar...",
                description:
                    "Masih menyimpan item ke keranjang. Coba lagi sebentar.",
                duration: 1.5,
            });
            return;
        }

        if (discountAmount > subtotal) {
            notification.error({
                message: "Error",
                description: "Diskon tidak boleh melebihi subtotal.",
                duration: 1.5,
            });
            return;
        }

        if (isCashLikePayment && cashValue < grandTotal) {
            notification.error({
                message: "Error",
                description: "Uang pembayaran kurang!",
                duration: 1.5,
            });
            return;
        }

        Modal.confirm({
            title: "Proses Pembayaran?",
            content:
                paymentMethod === "transfer"
                    ? "Transaksi transfer akan disimpan sebagai pending. Konfirmasi setelah dana masuk ke rekening toko."
                    : isCashLikePayment
                      ? "Pastikan uang yang diterima sudah sesuai."
                      : "Pembayaran digital akan diproses melalui Midtrans.",
            okText: "Ya, Bayar!",
            cancelText: "Batal",
            width: getModalWidth(isMobile),
            onOk: async () => {
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
                            cash: isCashLikePayment ? cashValue : 0,
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
                    notification.error({
                        message: "Error",
                        description:
                            error.message || "Terjadi kesalahan sistem.",
                    });
                }
            },
        });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "F2" || e.key === "f2") {
                e.preventDefault();
                storeTransaction(e);
            } else if (e.key === "F3" || e.key === "f3") {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === "Escape") {
                if (ppobModalProduct) {
                    setPpobModalProduct(null);
                } else if (unitModalProduct) {
                    setUnitModalProduct(null);
                } else if (showQuickCreateModal) {
                    setShowQuickCreateModal(false);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
        ppobModalProduct,
        unitModalProduct,
        showQuickCreateModal,
        localCarts,
        paymentMethod,
        discountValue,
        discountType,
        cashValue,
        customerId,
        isMobile,
    ]);

    const cartPanelProps = {
        activeCarts,
        heldCarts,
        cartQty,
        localCartsCount: localCarts.length,
        errors,
        flash,
        ppobAccount,
        customerSearch,
        customerResults,
        customerLoading,
        selectedCustomer,
        showCustomerDropdown,
        onCustomerSearch: handleCustomerSearch,
        onSelectCustomer: selectCustomer,
        onClearCustomer: clearCustomer,
        onShowQuickCreate: () => setShowQuickCreateModal(true),
        onCustomerFocus: () => {
            if (customerResults.length > 0) {
                setShowCustomerDropdown(true);
            }
        },
        onUpdateQty: handleQtyChange,
        onDelete: deleteCart,
        onToggleHold: toggleCartHold,
        onDiscountChange: handleDiscountChange,
    };

    const paymentSummaryProps = {
        paymentMethod,
        onPaymentMethodChange: (value) => {
            setPaymentMethod(value);
            if (value === "digital" || value === "transfer") {
                setCash("");
            }
        },
        discount,
        onDiscountChange: setDiscount,
        discountType,
        onDiscountTypeToggle: () =>
            setDiscountType(
                discountType === "nominal" ? "percent" : "nominal",
            ),
        cash,
        onCashChange: setCash,
        cashOptions,
        isCashLikePayment,
        subtotal,
        discountAmount,
        grandTotal,
        change,
        activeCartsCount: activeCarts.length,
        onSubmit: storeTransaction,
    };

    const checkoutPanel = (mobile = false) => (
        <section
            className={`pos-checkout-panel${mobile ? " pos-checkout-panel--mobile" : ""}`}
        >
            <PosCartPanel {...cartPanelProps} />
            <PosPaymentSummary {...paymentSummaryProps} />
        </section>
    );

    return (
        <>
            <Head>
                <title>POS Kasir - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                <div
                    className={`pos-cashier-page${isMobile ? " pos-cashier-page--mobile" : ""}`}
                >
                    <div className="pos-cashier-heading">
                        <div>
                            <h4>POS Kasir</h4>
                            <span>{cartQty} item dalam keranjang</span>
                        </div>

                        <Link href="/account/transactions">
                            <Button icon={<FileTextOutlined />}>
                                Riwayat
                            </Button>
                        </Link>
                    </div>

                    <div className="pos-cashier-main">
                        <PosProductGrid
                            searchInputRef={searchInputRef}
                            products={products}
                            searchQuery={searchQuery}
                            onSearchQueryChange={handleSearchQueryChange}
                            onSearchDebounced={handleSearchDebounced}
                            onAddToCart={addToCart}
                            showScannerButton
                            onOpenScanner={() => setShowBarcodeScanner(true)}
                        />

                        {!isMobile && checkoutPanel(false)}
                    </div>
                </div>

                {isMobile && (
                    <>
                        <div className="pos-mobile-cart-bar">
                            <div
                                className="pos-torn-edge pos-torn-edge--up"
                                aria-hidden="true"
                            />
                            <Button
                                type="primary"
                                size="large"
                                block
                                icon={<ShoppingCartOutlined />}
                                onClick={() => setCartDrawerOpen(true)}
                            >
                                Keranjang ({cartQty}) ·{" "}
                                {formatRupiah(grandTotal)}
                            </Button>
                        </div>

                        <Drawer
                            title="Keranjang & Pembayaran"
                            placement="bottom"
                            open={cartDrawerOpen}
                            onClose={() => setCartDrawerOpen(false)}
                            height="92vh"
                            className="pos-mobile-cart-drawer"
                            destroyOnClose={false}
                        >
                            {checkoutPanel(true)}
                        </Drawer>
                    </>
                )}

                <PosPpobModal
                    product={ppobModalProduct}
                    open={!!ppobModalProduct}
                    customerRef={customerRef}
                    ppobCost={ppobCost}
                    adminFee={adminFee}
                    onCustomerRefChange={setCustomerRef}
                    onPpobCostChange={setPpobCost}
                    onAdminFeeChange={setAdminFee}
                    onCancel={() => setPpobModalProduct(null)}
                    onSubmit={submitPpobCart}
                />

                <PosUnitModal
                    product={unitModalProduct}
                    open={!!unitModalProduct}
                    selectedUnitId={selectedUnitId}
                    onUnitChange={setSelectedUnitId}
                    onCancel={() => setUnitModalProduct(null)}
                    onSubmit={submitUnitCart}
                />

                <PosQuickCustomerModal
                    open={showQuickCreateModal}
                    name={quickCustomerName}
                    phone={quickCustomerPhone}
                    onNameChange={setQuickCustomerName}
                    onPhoneChange={setQuickCustomerPhone}
                    onCancel={() => {
                        setShowQuickCreateModal(false);
                        setQuickCustomerName("");
                        setQuickCustomerPhone("");
                    }}
                    onSubmit={submitQuickCreateCustomer}
                />

                {showBarcodeScanner && (
                    <BarcodeScanner
                        onScan={handleBarcodeScan}
                        onClose={() => setShowBarcodeScanner(false)}
                    />
                )}
                </Spin>
            </LayoutAccount>
        </>
    );
}
