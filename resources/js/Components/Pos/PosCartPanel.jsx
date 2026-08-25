import { useState } from "react";
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
    DeleteOutlined,
    PauseOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import { formatRupiah } from "../../Utils/format";
import { lineDiscountAmount, lineNet } from "./posUtils";
import useMobile from "../../Hooks/useMobile";
import { numericMobileInputProps } from "../../Utils/responsive";
import { NEUTRAL } from "../../theme/colors";

const { Text } = Typography;

function CartRow({
    cart,
    held = false,
    onUpdateQty,
    onDelete,
    onToggleHold,
    onDiscountChange,
    isMobile,
}) {
    const [showDiscount, setShowDiscount] = useState(
        Number(cart.discount || 0) > 0,
    );
    const itemDiscount = lineDiscountAmount(cart);
    const net = lineNet(cart);
    const isPpob = cart.ppob_cost != null;

    return (
        <div className={`pos-cart-row${held ? " pos-cart-row--held" : ""}`}>
            <div className="pos-cart-row-top">
                <div className="pos-cart-name">
                    <strong>{cart.product?.title || "Produk"}</strong>
                    {held && (
                        <Tag className="pos-cart-held-badge">Ditahan</Tag>
                    )}
                </div>
                <div className="pos-cart-price">
                    <strong className="pos-price-highlight">
                        {formatRupiah(net)}
                    </strong>
                    {itemDiscount > 0 && (
                        <span className="pos-cart-discount-tag">
                            -{formatRupiah(itemDiscount)}
                        </span>
                    )}
                </div>
            </div>

            <div className="pos-cart-row-meta">
                <span className="pos-cart-meta-text">
                    {isPpob ? (
                        <>
                            Modal {formatRupiah(cart.ppob_cost)} + Fee{" "}
                            {formatRupiah(cart.admin_fee)}
                        </>
                    ) : (
                        <>
                            {cart.unit?.abbreviation || cart.product?.unit} ·{" "}
                            {formatRupiah(cart.price)}
                        </>
                    )}
                    {cart.customer_ref && (
                        <span className="pos-cart-ref">
                            {" "}
                            · Ref: {cart.customer_ref}
                        </span>
                    )}
                </span>
                {!held && (
                    <button
                        type="button"
                        className="pos-cart-discount-toggle"
                        onClick={() => setShowDiscount((v) => !v)}
                    >
                        Diskon
                    </button>
                )}
            </div>

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

            <div className="pos-cart-row-bottom">
                {!held ? (
                    <Space.Compact className="pos-qty-stepper">
                        <Button
                            onClick={() => onUpdateQty(cart.id, cart.qty - 1)}
                        >
                            −
                        </Button>
                        <InputNumber
                            className="pos-qty-input"
                            min={1}
                            value={cart.qty}
                            controls={false}
                            onChange={(value) => {
                                if (value != null && value >= 1) {
                                    onUpdateQty(cart.id, value, true);
                                }
                            }}
                            {...numericMobileInputProps(isMobile)}
                        />
                        <Button
                            onClick={() => onUpdateQty(cart.id, cart.qty + 1)}
                        >
                            +
                        </Button>
                    </Space.Compact>
                ) : (
                    <span />
                )}

                <Space size={6}>
                    {held ? (
                        <Button
                            type="default"
                            className="pos-cart-tool-btn"
                            icon={<PlayCircleOutlined />}
                            onClick={() => onToggleHold(cart.id, false)}
                            title="Lanjutkan"
                        />
                    ) : (
                        <Button
                            type="default"
                            className="pos-cart-tool-btn"
                            icon={<PauseOutlined />}
                            onClick={() => onToggleHold(cart.id, true)}
                            title="Tahan"
                        />
                    )}
                    <Button
                        type="text"
                        danger
                        className="pos-cart-tool-btn pos-cart-tool-btn--danger"
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete(cart.id)}
                        title="Hapus"
                    />
                </Space>
            </div>
        </div>
    );
}

export default function PosCartPanel({
    activeCarts,
    heldCarts,
    cartQty,
    localCartsCount,
    errors,
    flash,
    ppobAccount,
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
}) {
    const isMobile = useMobile();

    return (
        <>
            <div className="pos-checkout-header">
                <h5>Keranjang</h5>
                <span className="pos-cart-count">{cartQty} item</span>
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
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="pos-empty-cart">
                        <ShoppingOutlined style={{ fontSize: 32 }} />
                        <strong>Keranjang kosong</strong>
                        <span>
                            Pindai barcode atau pilih produk untuk mulai
                            transaksi.
                        </span>
                    </div>
                )}
            </div>

            <div className="pos-cart-customer">
                <label className="pos-field-label">Pelanggan</label>
                {selectedCustomer ? (
                    <Space.Compact style={{ width: "100%" }}>
                        <Input value={selectedCustomer.name} readOnly />
                        <Button
                            icon={<CloseOutlined />}
                            onClick={onClearCustomer}
                            title="Hapus pelanggan"
                        />
                    </Space.Compact>
                ) : (
                    <Space.Compact style={{ width: "100%" }}>
                        <AutoComplete
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
                                                    color: NEUTRAL.slate500,
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
        </>
    );
}
