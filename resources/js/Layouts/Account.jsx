import React, { useState } from "react";
import { Alert, Button, Dropdown, Flex, Layout, Menu, Space, theme } from "antd";
import {
    BulbFilled,
    BulbOutlined,
    DownOutlined,
    KeyOutlined,
    LogoutOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import { usePage, router, Link } from "@inertiajs/react";
import MenuSearchPalette from "../Components/MenuSearch/MenuSearchPalette";
import {
    resolveMenuSelectedKey,
    useSidebarMenuItems,
} from "../Components/Sidebar";
import { useTheme } from "../theme/ThemeContext";

const { Header, Sider, Content } = Layout;

export default function LayoutAccount({ children }) {
    const page = usePage();
    const { auth, store, flash } = page.props;
    const { url } = page;
    const [collapsed, setCollapsed] = useState(false);
    const { mode, toggleTheme } = useTheme();
    const { token } = theme.useToken();

    const storeName = store?.name || "VASIA STORE";
    const storeLogo = store?.logo_url;
    const userName = auth?.user?.name || "User";
    const permissions = auth?.permissions || {};

    const menuItems = useSidebarMenuItems(permissions);
    const selectedKey = resolveMenuSelectedKey(url);

    const logoutHandler = () => {
        router.post("/logout");
    };

    const userMenuItems = [
        {
            key: "password",
            icon: <KeyOutlined />,
            label: <Link href="/account/password">Ubah Kata Sandi</Link>,
        },
        { type: "divider" },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Keluar",
            onClick: logoutHandler,
        },
    ];

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
                <div
                    style={{
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: 12,
                        padding: collapsed ? "0 8px" : "0 16px",
                        overflow: "hidden",
                    }}
                >
                    {storeLogo ? (
                        <img
                            src={storeLogo}
                            alt={storeName}
                            style={{
                                width: 32,
                                height: 32,
                                objectFit: "contain",
                                flexShrink: 0,
                            }}
                        />
                    ) : (
                        <ShopOutlined
                            style={{ fontSize: 24, color: "#fff" }}
                        />
                    )}
                    {!collapsed && (
                        <strong
                            style={{
                                color: "#fff",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {storeName}
                        </strong>
                    )}
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={selectedKey ? [selectedKey] : []}
                    items={menuItems}
                />
            </Sider>

            <Layout>
                <Header
                    style={{
                        background: token.colorBgContainer,
                        padding: "0 16px",
                        lineHeight: "normal",
                        height: 64,
                    }}
                >
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ height: "100%" }}
                    >
                        <MenuSearchPalette />
                        <Space>
                            <Button
                                type="text"
                                aria-label={
                                    mode === "dark"
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                }
                                icon={
                                    mode === "dark" ? (
                                        <BulbFilled />
                                    ) : (
                                        <BulbOutlined />
                                    )
                                }
                                onClick={toggleTheme}
                            />
                            <Dropdown menu={{ items: userMenuItems }}>
                                <Space style={{ cursor: "pointer" }}>
                                    <span style={{ fontWeight: 600 }}>
                                        {userName}
                                    </span>
                                    <DownOutlined />
                                </Space>
                            </Dropdown>
                        </Space>
                    </Flex>
                </Header>

                <Content
                    style={{
                        margin: 16,
                        padding: 16,
                        background: token.colorBgContainer,
                        borderRadius: 8,
                    }}
                >
                    {flash?.success && (
                        <Alert
                            message={flash.success}
                            type="success"
                            showIcon
                            closable
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    {flash?.error && (
                        <Alert
                            message={flash.error}
                            type="error"
                            showIcon
                            closable
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
