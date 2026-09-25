import { useEffect, useRef, useState } from "react";
import {
    AutoComplete,
    Button,
    Input,
    InputNumber,
    Space,
    Tag,
    Typography,
} from "antd";
import {
    CloseOutlined,
    PauseOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import { lineDiscountAmount, lineNet } from "./posUtils";
import useMobile from "../../Hooks/useMobile";
import { numericMobileInputProps } from "../../Utils/responsive";
const { Text } = Typography;

function CartRow({
    cart,
    held = false,
    onUpdateQty,
    onDelete,
    onToggleHold,
    onDiscountChange,
    onUpdatePrice,
    isMobile,
}) {
    const [showDiscount, setShowDiscount] = useState(
        Number(cart.discount || 0) > 0,
    );
    const [editingPrice, setEditingPrice] = useState(false);
    const [draftPrice, setDraftPrice] = useState(cart.price ?? 0);
    const skipBlurSave = useRef(false);
    const itemDiscount = lineDiscountAmount(cart);
    const net = lineNet(cart);
    const isPpob = cart.ppob_cost != null;
    const canEditPrice = !isPpob && !held && onUpdatePrice;

    useEffect(() => {
        if (!editingPrice) {
            setDraftPrice(cart.price ?? 0);
        }
    }, [cart.price, editingPrice]);

    const cancelPriceEdit = () => {
        skipBlurSave.current = true;
        setDraftPrice(cart.price ?? 0);
        setEditingPrice(false);
    };

    const commitPriceEdit = () => {
        skipBlurSave.current = true;
        const next = Math.max(0, Math.round(Number(draftPrice) || 0));
        setEditingPrice(false);
        if (next !== Number(cart.price ?? 0)) {
            onUpdatePrice?.(cart.id, next);
        }
    };

    const handlePriceBlur = () => {
        if (skipBlurSave.current) {
            skipBlurSave.current = false;
            return;
        }
        commitPriceEdit();
    };

    const handlePriceKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            commitPriceEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelPriceEdit();
        }
    };

    const unitAbbrev =
        cart.unit?.abbreviation || cart.product?.unit || "pcs";

    return (
        <div className={`pos-nota-row${held ? " pos-nota-row--held" : ""}`}>
            <div className="pos-nota-row-name">
                {cart.product?.title || "Produk"}
                {held && (
                    <Tag className="pos-cart-held-badge">Ditahan</Tag>
                )}
            </div>
            <div className="pos-nota-row-amount">
                <strong>{formatRupiah(net)}</strong>
                {itemDiscount > 0 && (
                    <span className="pos-cart-discount-tag">
                        -{formatRupiah(itemDiscount)}
                    </span>
                )}
            </div>
            <div className="pos-nota-row-sub">
                <span className="pos-cart-meta-text">
                    {isPpob ? (
                        <>
                            Modal {formatRupiah(cart.ppob_cost)} + Fee{" "}
                            {formatRupiah(cart.admin_fee)}
                        </>
                    ) : (
                        <>
                            {cart.qty} ×{" "}
                            {canEditPrice && editingPrice ? (
                                <InputNumber
                                    autoFocus
                                    className="pos-cart-unit-price-input"
                                    min={0}
                                    size="small"
                                    controls={false}
                                    value={draftPrice}
                                    onChange={(value) =>
                                        setDraftPrice(value ?? 0)
                                    }
                                    onBlur={handlePriceBlur}
                                    onKeyDown={handlePriceKeyDown}
                                    {...numericMobileInputProps(isMobile)}
                                />
                            ) : canEditPrice ? (
                                <button
                                    type="button"
                                    className="pos-cart-unit-price-btn"
                                    onClick={() => {
                                        setDraftPrice(cart.price ?? 0);
                                        setEditingPrice(true);
                                    }}
                                    title="Klik untuk ubah harga"
                                    aria-label="Ubah harga"
                                >
                                    {formatRupiah(cart.price)}
                                </button>
                            ) : (
                                formatRupiah(cart.price)
                            )}
                            {!isPpob && ` /${unitAbbrev}`}
                        </>
                    )}
                    {cart.customer_ref && (
                        <span className="pos-cart-ref">
                            {" "}
                            · Ref: {cart.customer_ref}
                        </span>
                    )}
                </span>
            </div>
            {!held && (
                <div className="pos-nota-row-tools">
                    <button
                        type="button"
                        className="pos-cart-discount-toggle"
                        onClick={() => setShowDiscount((v) => !v)}
                    >
                        Diskon item
                    </button>
                </div>
            )}

            {!held && showDiscount && (
                <div className="pos-cart-row-discount">
                    <Space.Compact size="small" className="pos-cart-discount-input">
                        <Button
                            onClick={() =>
                                onDiscountChange(
                                    cart.id,
                                    cart.discount || 0,
                                    (cart.discount_type || "nominal") ===
                                        "nominal"
                                        ? "percent"
                                        : "nominal",
                                )
                            }
                            title="Toggle Rp / %"
                        >
                            {(cart.discount_type || "nominal") === "percent"
                                ? "%"
                                : "Rp"}
                        </Button>
                        <InputNumber
                            min={0}
                            value={cart.discount || 0}
                            onChange={(value) =>
                                onDiscountChange(
                                    cart.id,
                                    value ?? 0,
                                    cart.discount_type || "nominal",
                                )
                            }
                            style={{ width: "100%" }}
                            {...numericMobileInputProps(isMobile)}
                        />
                    </Space.Compact>
                </div>
            )}

            {!held && (
                <div className="pos-nota-row-acts">
                    <button
                        type="button"
                        className="pos-nota-act-btn"
                        onClick={() => onUpdateQty(cart.id, cart.qty - 1)}
                    >
                        − 1
                    </button>
                    <button
                        type="button"
                        className="pos-nota-act-btn"
                        onClick={() => onUpdateQty(cart.id, cart.qty + 1)}
                    >
                        + 1
                    </button>
                    <button
                        type="button"
                        className="pos-nota-act-btn pos-nota-act-btn--danger"
                        onClick={() => onDelete(cart.id)}
                    >
                        Hapus
                    </button>
                </div>
            )}
        </div>
    );
}

export default function PosCartPanel({
    activeCarts,
    heldCarts,
    cartQty,
    cashierName,
    errors,
    flash,
    ppobAccount,
    onClearCart,
    customerSearch,
    customerResults,
    customerLoading,
    selectedCustomer,
    showCustomerDropdown,
    onCustomerSearch,
    onSelectCustomer,
    onClearCustomer,
    onShowQuickCreate,
    onCustomerFocus,
    onUpdateQty,
    onDelete,
    onToggleHold,
    onDiscountChange,
    onUpdatePrice,
}) {
    const isMobile = useMobile();

    const cartBody = (
        <div className="pos-nota-body">
            <div className="pos-nota-head">
                <div className="pos-nota-head-title">NOTA PENJUALAN</div>
                <div className="pos-nota-head-meta">
                    <span>
                        Nota baru · {cashierName || "Kasir"} ·{" "}
                        <strong>{cartQty}</strong> item
                    </span>
                    {activeCarts.length > 0 && onClearCart && (
                        <button
                            type="button"
                            className="pos-nota-clear-btn"
                            onClick={onClearCart}
                        >
                            Kosongkan
                        </button>
                    )}
                </div>
            </div>

            {(errors?.error || flash?.error) && (
                <div className="pos-cart-alert">
                    <Tag color="error" className="pos-cart-alert-tag">
                        {errors?.error || flash?.error}
                    </Tag>
                </div>
            )}

            {ppobAccount && (
                <div className="pos-cart-alert">
                    <Tag
                        color={
                            ppobAccount.is_low_balance ? "error" : "default"
                        }
                        className="pos-cart-alert-tag"
                    >
                        Saldo PPOB ({ppobAccount.name}):{" "}
                        <strong>
                            {formatRupiah(ppobAccount.current_balance)}
                        </strong>
                    </Tag>
                </div>
            )}

            <div className="pos-cart-list">
                {activeCarts.length > 0 || heldCarts.length > 0 ? (
                    <>
                        {activeCarts.map((cart) => (
                            <CartRow
                                key={cart.id}
                                cart={cart}
                                isMobile={isMobile}
                                onUpdateQty={onUpdateQty}
                                onDelete={onDelete}
                                onToggleHold={onToggleHold}
                                onDiscountChange={onDiscountChange}
                                onUpdatePrice={onUpdatePrice}
                            />
                        ))}
                        {heldCarts.length > 0 && (
                            <div className="pos-held-section">
                                <div className="pos-held-section-label">
                                    <PauseOutlined /> Ditahan (
                                    {heldCarts.length})
                                </div>
                                {heldCarts.map((cart) => (
                                    <CartRow
                                        key={cart.id}
                                        cart={cart}
                                        held
                                        isMobile={isMobile}
                                        onUpdateQty={onUpdateQty}
                                        onDelete={onDelete}
                                        onToggleHold={onToggleHold}
                                        onDiscountChange={onDiscountChange}
                                        onUpdatePrice={onUpdatePrice}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="pos-empty-cart pos-nota-empty">
                        <span>
                            Keranjang masih kosong. Pilih produk di kiri atau
                            scan barcode.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    const customerBlock = (
            <div className="pos-cart-customer">
                <label className="pos-field-label">Pelanggan</label>
                {selectedCustomer ? (
                    <Space.Compact style={{ width: "100%" }}>
                        <Input size="small" value={selectedCustomer.name} readOnly />
                        <Button
                            icon={<CloseOutlined />}
                            onClick={onClearCustomer}
                            title="Hapus pelanggan"
                        />
                    </Space.Compact>
                ) : (
                    <Space.Compact style={{ width: "100%" }}>
                        <AutoComplete
                            size="small"
                            style={{ flex: 1 }}
                            value={customerSearch}
                            options={customerResults.map((c) => ({
                                value: c.name,
                                label: (
                                    <div>
                                        <strong>{c.name}</strong>
                                        {c.no_telp && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--icon-muted)",
                                                }}
                                            >
                                                {c.no_telp}
                                            </div>
                                        )}
                                    </div>
                                ),
                                customer: c,
                            }))}
                            onSearch={onCustomerSearch}
                            onSelect={(_, option) =>
                                onSelectCustomer(option.customer)
                            }
                            onFocus={onCustomerFocus}
                            placeholder="Cari nama atau No. HP..."
                            notFoundContent={
                                customerLoading ? (
                                    "Mencari..."
                                ) : customerSearch.trim() ? (
                                    <span>
                                        Tidak ditemukan.{" "}
                                        <Button
                                            type="link"
                                            size="small"
                                            style={{ padding: 0 }}
                                            onClick={onShowQuickCreate}
                                        >
                                            Tambah baru?
                                        </Button>
                                    </span>
                                ) : null
                            }
                        />
                        <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={onShowQuickCreate}
                            title="Tambah Pelanggan Cepat"
                        />
                    </Space.Compact>
                )}
                {showCustomerDropdown &&
                    customerResults.length > 0 &&
                    !selectedCustomer && (
                        <Button
                            type="link"
                            size="small"
                            style={{ padding: 0, marginTop: 4 }}
                            onClick={onClearCustomer}
                        >
                            Pilih Umum (tanpa pelanggan)
                        </Button>
                    )}
            </div>
    );

    return (
        <>
            {cartBody}
            {customerBlock}
        </>
    );
}
