import React, { useState } from "react";
import { Alert, Layout } from "antd";
import {
    DownOutlined,
    LogoutOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import { usePage, router, Link } from "@inertiajs/react";

const { Header, Sider, Content } = Layout;

export default function LayoutAccount({ children }) {
    const page = usePage();
    const { auth, store, flash } = page.props;
    const [collapsed, setCollapsed] = useState(false);

    const storeName = store?.name || "VASIA STORE";
    const userName = auth?.user?.name || "User";

    const logoutHandler = () => {
        router.post("/logout");
    };

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                collapsedWidth={64}
                width={240}
                theme="dark"
            >
                <div style={{
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: collapsed ? 14 : 18,
                }}>
                    {collapsed ? <ShopOutlined /> : storeName}
                </div>

                {/* Simplified nav links — no Menu component yet */}
                <div style={{ padding: "8px 16px" }}>
                    <Link href="/account/dashboard" style={{ color: "#fff", display: "block", padding: "8px 0" }}>
                        Dashboard
                    </Link>
                    <Link href="/account/products" style={{ color: "#fff", display: "block", padding: "8px 0" }}>
                        Produk
                    </Link>
                    <Link href="/account/transactions/create" style={{ color: "#fff", display: "block", padding: "8px 0" }}>
                        POS Kasir
                    </Link>
                </div>
            </Sider>

            <Layout>
                <Header style={{
                    background: "#fff",
                    padding: "0 16px",
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <span style={{ fontWeight: 600 }}>{storeName}</span>
                    <div style={{ cursor: "pointer" }} onClick={logoutHandler}>
                        {userName} <DownOutlined />
                    </div>
                </Header>

                <Content style={{
                    margin: 16,
                    padding: 16,
                    background: "#fff",
                    borderRadius: 8,
                }}>
                    {flash?.success && (
                        <Alert message={flash.success} type="success" showIcon closable style={{ marginBottom: 16 }} />
                    )}
                    {flash?.error && (
                        <Alert message={flash.error} type="error" showIcon closable style={{ marginBottom: 16 }} />
                    )}
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
