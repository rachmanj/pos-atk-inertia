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
    const itemDiscount = lineDiscountAmount(cart);
    const net = lineNet(cart);

    return (
        <div
            className="pos-cart-row"
            style={held ? { opacity: 0.75 } : undefined}
        >
            <div className="pos-cart-main">
                <strong>{cart.product?.title || "Produk"}</strong>
                {held && (
                    <Tag style={{ marginLeft: 4 }}>Ditahan</Tag>
                )}
                <span>
                    {cart.ppob_cost != null ? (
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
                </span>
                {cart.customer_ref && (
                    <Text
                        type="secondary"
                        style={{ display: "block" }}
                    >
                        Ref: {cart.customer_ref}
                    </Text>
                )}
                {!held && (
                    <div
                        style={{
                            marginTop: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Diskon
                        </Text>
                        <Space.Compact size="small" style={{ maxWidth: 160 }}>
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
                                style={{ width: 90 }}
                                {...numericMobileInputProps(isMobile)}
                            />
                        </Space.Compact>
                    </div>
                )}
            </div>

            <div className="pos-cart-actions">
                {!held && (
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
                            style={{ width: 52, textAlign: "center" }}
                            {...numericMobileInputProps(isMobile)}
                        />
                        <Button
                            onClick={() => onUpdateQty(cart.id, cart.qty + 1)}
                        >
                            +
                        </Button>
                    </Space.Compact>
                )}

                <div style={{ textAlign: "right" }}>
                    <strong>{formatRupiah(net)}</strong>
                    {itemDiscount > 0 && (
                        <Text
                            type="danger"
                            style={{ display: "block", fontSize: 12 }}
                        >
                            -{formatRupiah(itemDiscount)}
                        </Text>
                    )}
                </div>

                <Space size={4}>
                    {held ? (
                        <Button
                            type="default"
                            icon={<PlayCircleOutlined />}
                            onClick={() => onToggleHold(cart.id, false)}
                            title="Lanjutkan"
                        />
                    ) : (
                        <Button
                            type="default"
                            icon={<PauseOutlined />}
                            onClick={() => onToggleHold(cart.id, true)}
                            title="Tahan"
                        />
                    )}
                    <Button
                        type="text"
                        danger
                        className="pos-cart-delete"
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete(cart.id)}
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
                <div>
                    <h5>Keranjang</h5>
                    <span>{localCartsCount} baris transaksi</span>
                </div>
                <span className="pos-cart-count">{cartQty}</span>
            </div>

            {(errors?.error || flash?.error) && (
                <div style={{ margin: "12px 12px 0" }}>
                    <Tag
                        color="error"
                        style={{
                            display: "flex",
                            width: "100%",
                            padding: 8,
                        }}
                    >
                        {errors?.error || flash?.error}
                    </Tag>
                </div>
            )}

            {ppobAccount && (
                <div style={{ margin: "12px 12px 0" }}>
                    <Tag
                        color={
                            ppobAccount.is_low_balance ? "error" : "default"
                        }
                        style={{
                            display: "flex",
                            width: "100%",
                            padding: 8,
                        }}
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
                            <div style={{ padding: "8px 12px 0" }}>
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                    }}
                                >
                                    Item ditahan ({heldCarts.length})
                                </Text>
                            </div>
                        )}
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

            <div style={{ padding: "0 12px 8px" }}>
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
